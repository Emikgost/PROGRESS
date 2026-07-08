// cloud.js
import { auth, db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const REV_KEY = "dash-base-rev";
const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;
let pushing = false;
let pendingWhilePushing = false;

function baseRev() { return Number(localStorage.getItem(REV_KEY) || 0); }
function setBaseRev(r) { nativeSet(REV_KEY, String(r)); }

// Adopt the cloud copy into local storage, then reload so the app boots from it.
function adoptAndReload(blob, rev) {
  nativeSet(STORE_KEY, blob);
  setBaseRev(rev);
  window.location.reload();
}

// Guarded push: only overwrites the cloud copy if we're building on the exact revision we last
// synced. A stale/late write (older base rev) is refused, so it can never clobber newer data.
async function doPush() {
  if (!currentUid || !ready) return;
  if (pushing) { pendingWhilePushing = true; return; }
  const blob = localStorage.getItem(STORE_KEY);
  if (blob == null) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return; // retry on reconnect
  pushing = true;
  const ref = doc(db, "users", currentUid);
  const myBase = baseRev();
  try {
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cloudRev = snap.exists() ? (snap.data().rev || 0) : 0;
      if (snap.exists() && cloudRev !== myBase) {
        return { conflict: true, cloudRev, data: snap.data() }; // cloud moved on — don't overwrite
      }
      const newRev = cloudRev + 1;
      tx.set(ref, { blob, rev: newRev, updatedAt: Date.now() });
      return { conflict: false, newRev };
    });
    if (result.conflict) {
      if (result.data && result.data.blob) adoptAndReload(result.data.blob, result.cloudRev);
    } else {
      setBaseRev(result.newRev);
    }
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
  pushTimer = setTimeout(doPush, 1500);
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
    window.addEventListener("online", () => schedulePush()); // retry when connection returns
  }
}

export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      if (blob && cloudRev > baseRev()) {
        nativeSet(STORE_KEY, blob);
        setBaseRev(cloudRev);
        ready = true;
        return "reload";
      }
    }
    ready = true;
    await doPush(); // we're at/ahead of the cloud → push our copy (guarded)
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
