// cloud.js
import { db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const SYNCED_REV = "dash-synced-rev"; // the cloud rev this device last pulled or successfully wrote
const DIRTY = "dash-dirty";           // "1" = we have local changes that haven't reached the cloud yet

const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;
let pushing = false;
let pendingWhilePushing = false;

const syncedRev = () => Number(localStorage.getItem(SYNCED_REV) || 0);
const setSyncedRev = (r) => nativeSet(SYNCED_REV, String(r));
const isDirty = () => localStorage.getItem(DIRTY) === "1";
const setDirty = (v) => nativeSet(DIRTY, v ? "1" : "0");

// Push our local blob. The transaction always reads the cloud's CURRENT rev and writes rev+1,
// so a push is never refused and can never deadlock. `dirty` is only cleared once the write
// has actually landed — so a failed/offline push stays queued and retries.
async function doPush() {
  if (!currentUid || !ready) return;
  if (pushing) { pendingWhilePushing = true; return; }
  const blob = localStorage.getItem(STORE_KEY);
  if (blob == null) return;
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
    setSyncedRev(newRev);
    setDirty(false); // confirmed in the cloud
  } catch (e) {
    // Stays dirty → retried on next save, on reconnect, or on next app open.
    console.error("[sync] push failed, will retry:", (e && e.code) || e);
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
    if (key === STORE_KEY) { setDirty(true); schedulePush(); }
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
    window.addEventListener("online", schedulePush); // retry when the connection returns
  }
}

// On login, decide honestly: does the cloud have something newer than us, or do we have
// unsynced local edits? Pull only when the cloud is genuinely ahead AND we have nothing
// unsynced. Otherwise push, so our edits are never silently discarded.
export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const localBlob = localStorage.getItem(STORE_KEY);

    if (snap.exists()) {
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      const noLocalData = localBlob == null;
      const cloudIsAhead = cloudRev > syncedRev();

      if (blob && (noLocalData || (cloudIsAhead && !isDirty()))) {
        nativeSet(STORE_KEY, blob);
        setSyncedRev(cloudRev);
        setDirty(false);
        ready = true;
        return "reload"; // adopt the cloud copy and boot from it
      }
      // Else: we're current, or we hold unsynced edits → our copy goes up.
    }

    ready = true;
    if (localBlob != null) await doPush();
  } catch (e) {
    console.error("[sync] initial sync failed, using local data:", e);
    ready = true;
  }
  return "ok";
}

export function stopCloudSync() {
  currentUid = null;
  ready = false;
  clearTimeout(pushTimer);
}
