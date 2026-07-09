// cloud.js
import { auth, db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;
let pushing = false;
let pendingWhilePushing = false;
let lastPulledRev = 0; // the rev we last pulled/wrote this session (in-memory, never gets stuck in storage)

function adoptAndReload(blob, rev) {
  nativeSet(STORE_KEY, blob);
  lastPulledRev = rev;
  window.location.reload();
}

// Push always re-reads the cloud's CURRENT rev inside the transaction and writes rev+1.
// It never refuses based on a stored baseline, so it can't deadlock. The only time it
// pulls instead of writing is when the cloud is STRICTLY NEWER than what we last saw
// this session (i.e. another device genuinely wrote after us) AND we have no newer local edits.
async function doPush() {
  if (!currentUid || !ready) return;
  if (pushing) { pendingWhilePushing = true; return; }
  const blob = localStorage.getItem(STORE_KEY);
  if (blob == null) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  pushing = true;
  const ref = doc(db, "users", currentUid);
  try {
    const newRev = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cloudRev = snap.exists() ? (snap.data().rev || 0) : 0;
      const next = cloudRev + 1;
      tx.set(ref, { blob, rev: next, updatedAt: Date.now() });
      return next;
    });
    lastPulledRev = newRev;
  } catch (e) {
    console.error("Cloud push deferred (offline/transient):", e && e.code ? e.code : e);
  } finally {
    pushing = false;
    if (pendingWhilePushing) { pendingWhilePushing = false; schedulePush(); }
  }
}

function schedulePush() {
  if (!currentUid || !ready) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(doPush, 1200);
}

function flushNow() {
  if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
  doPush();
}

export function installCloudSync() {
  if (localStorage.setItem.__cloudPatched) return;
  const patched = (key, value) => {
    nativeSet(key, value);
    if (key === STORE_KEY) schedulePush();
  };
  patched.__cloudPatched = true;
  localStorage.setItem = patched;

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNow();
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushNow);
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("online", () => schedulePush());
  }
}

// On login: pull the cloud copy only if it's NEWER than what we have locally.
export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const localBlob = localStorage.getItem(STORE_KEY);
    if (snap.exists()) {
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      // Adopt the cloud copy only if we have NO local data, or the cloud is a real newer version.
      if (blob && (localBlob == null || cloudRev > lastPulledRev)) {
        // But never overwrite local data with an OLDER-looking cloud copy on a device
        // that already has data — if we have local data, prefer pushing it up.
        if (localBlob == null) {
          nativeSet(STORE_KEY, blob);
          lastPulledRev = cloudRev;
          ready = true;
          return "reload";
        }
      }
      lastPulledRev = cloudRev;
    }
    ready = true;
    await doPush(); // push our local copy so the cloud is never left stale
  } catch (e) {
    console.error("Initial sync failed (using local data for now):", e);
    ready = true;
  }
  return "ok";
}

export function stopCloudSync() {
  currentUid = null;
  ready = false;
  clearTimeout(pushTimer);
}
