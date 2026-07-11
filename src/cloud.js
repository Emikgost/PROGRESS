// cloud.js  —  v4
// Design notes (why this cannot repeat the old failures):
//   * No wall clocks  -> device clock skew can never discard your data.
//   * No "dirty" flag -> nothing can get stuck "on" and block a pull forever.
//     "Do I have unsaved changes?" is COMPUTED by hashing the current data and
//     comparing it to the hash of the last copy we synced. It self-corrects.
//   * A push is NEVER refused -> it cannot deadlock the way the old versions did.
//   * If the content did not actually change, we do not push at all -> two open
//     tabs cannot ping-pong reloads at each other.
import { db } from "./firebase";
import { doc, getDoc, onSnapshot, runTransaction } from "firebase/firestore";
 
const VERSION = 4;
const STORE_KEY = "dash-v18";
const SYNCED_REV = "dash-synced-rev";   // cloud revision this device is based on
const SYNCED_HASH = "dash-synced-hash"; // hash of the data at that revision
 
const nativeSet = localStorage.setItem.bind(localStorage);
 
console.log("[sync] cloud.js v" + VERSION + " active");
nativeSet("dash-sync-version", String(VERSION));
 
let currentUid = null;
let ready = false;
let pushTimer = null;
let pushing = false;
let pendingWhilePushing = false;
let unsubscribe = null;
 
// Fast, stable string hash (FNV-1a). Used only to answer "did the data change?"
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return String(h);
}
 
const syncedRev = () => Number(localStorage.getItem(SYNCED_REV) || 0);
const syncedHash = () => localStorage.getItem(SYNCED_HASH) || "";
const localBlob = () => localStorage.getItem(STORE_KEY);
 
function markSynced(rev, blob) {
  nativeSet(SYNCED_REV, String(rev));
  nativeSet(SYNCED_HASH, hash(blob));
}
 
// Do we hold edits that have not reached the cloud? Computed from content — never stuck.
function hasLocalChanges() {
  const b = localBlob();
  if (b == null) return false;
  return hash(b) !== syncedHash();
}
 
function adopt(blob, rev) {
  nativeSet(STORE_KEY, blob);
  markSynced(rev, blob);
  window.location.reload();
}
 
async function doPush() {
  if (!currentUid || !ready) return;
  if (pushing) { pendingWhilePushing = true; return; }
  const blob = localBlob();
  if (blob == null) return;
  if (!hasLocalChanges()) return; // nothing actually changed — do not touch the cloud
  pushing = true;
  try {
    const result = await runTransaction(db, async (tx) => {
      const ref = doc(db, "users", currentUid);
      const snap = await tx.get(ref);
      const cloudRev = snap.exists() ? (snap.data().rev || 0) : 0;
      const next = cloudRev + 1;
      tx.set(ref, { blob, rev: next, updatedAt: Date.now() }); // updatedAt is display-only
      return next;
    });
    markSynced(result, blob); // now in sync, and no longer "changed"
    console.log("[sync] pushed (rev " + result + ")");
  } catch (e) {
    // Stays "changed" -> retried on next save, on reconnect, or next app open.
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
 
// LIVE: another device saved something -> take it, unless we hold our own unsaved edits.
function startListening(uid) {
  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      if (!snap.exists() || snap.metadata.hasPendingWrites) return;
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      if (!blob) return;
      if (cloudRev <= syncedRev()) return;      // nothing new
      if (blob === localBlob()) { markSynced(cloudRev, blob); return; } // same data, just re-stamp
      if (hasLocalChanges()) {                  // we have our own unsaved edits -> keep ours, push
        console.log("[sync] local edits pending — keeping ours");
        schedulePush();
        return;
      }
      console.log("[sync] newer data from another device — adopting (rev " + cloudRev + ")");
      adopt(blob, cloudRev);
    },
    (e) => console.error("[sync] listener error:", (e && e.code) || e)
  );
}
 
export function installCloudSync() {
  if (!localStorage.setItem.__cloudPatched) {
    const patched = (key, value) => {
      nativeSet(key, value);
      if (key === STORE_KEY) schedulePush();
    };
    patched.__cloudPatched = true;
    localStorage.setItem = patched;
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNow();
      else schedulePush();
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushNow);
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("online", schedulePush);
  }
  if (currentUid) startListening(currentUid);
}
 
export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const local = localBlob();
 
    if (snap.exists()) {
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      const cloudIsNewer = cloudRev > syncedRev();
 
      if (blob && local == null) {                       // brand-new device
        nativeSet(STORE_KEY, blob); markSynced(cloudRev, blob);
        ready = true; console.log("[sync] first load — took cloud copy");
        return "reload";
      }
      if (blob && cloudIsNewer && !hasLocalChanges()) {  // cloud ahead, we have nothing pending
        nativeSet(STORE_KEY, blob); markSynced(cloudRev, blob);
        ready = true; console.log("[sync] adopted cloud copy (rev " + cloudRev + ")");
        return "reload";
      }
      if (blob && local === blob) markSynced(cloudRev, blob); // identical, just re-stamp
    }
 
    ready = true;
    if (local != null) await doPush(); // our copy is current or holds unsynced edits
  } catch (e) {
    console.error("[sync] initial sync failed, using local data:", (e && e.code) || e);
    ready = true;
  }
  return "ok";
}
 
export function stopCloudSync() {
  currentUid = null;
  ready = false;
  clearTimeout(pushTimer);
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}
 
