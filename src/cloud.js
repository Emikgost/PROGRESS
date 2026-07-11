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

const VERSION = 5;
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

// ---- Visible status (so you can SEE what sync is doing, on the phone, with no console) ----
const status = { version: VERSION, state: "starting", detail: "", rev: 0, at: Date.now() };
function setStatus(state, detail) {
  status.state = state; status.detail = detail || ""; status.at = Date.now();
  try { window.dispatchEvent(new CustomEvent("cloud-status", { detail: { ...status } })); } catch (e) {}
  renderBadge();
}
export function getCloudStatus() { return { ...status }; }

function renderBadge() {
  if (typeof document === "undefined" || !document.body) return;
  let el = document.getElementById("sync-badge");
  if (!el) {
    el = document.createElement("div");
    el.id = "sync-badge";
    el.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;font:11px/1.35 ui-monospace,monospace;" +
      "background:rgba(10,14,22,.92);color:#9FB0C4;border:1px solid #2A3646;border-radius:8px;padding:6px 9px;" +
      "max-width:70vw;pointer-events:auto;cursor:pointer;";
    el.onclick = () => { el.style.display = "none"; };
    document.body.appendChild(el);
  }
  const dot = status.state === "error" ? "#FF6B6B" : status.state === "pending" ? "#F5B301" : "#34E29B";
  const ago = Math.round((Date.now() - status.at) / 1000);
  el.innerHTML = '<span style="color:' + dot + '">\u25CF</span> sync v' + status.version +
    " \u00B7 " + status.state + (status.rev ? " \u00B7 rev " + status.rev : "") +
    (status.detail ? '<br><span style="color:#68788C">' + status.detail + "</span>" : "") +
    '<br><span style="color:#68788C">' + ago + "s ago \u00B7 tap to hide</span>";
}
setInterval(renderBadge, 5000);

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
    status.rev = result;
    setStatus("synced", "pushed your changes");
    console.log("[sync] pushed (rev " + result + ")");
  } catch (e) {
    // Stays "changed" -> retried on next save, on reconnect, or next app open.
    setStatus("error", "push failed: " + ((e && e.code) || e) + " (will retry)");
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
      if (!snap.exists()) return;
      const { blob, rev } = snap.data();
      const cloudRev = rev || 0;
      if (!blob) return;
      if (cloudRev <= syncedRev()) return;      // nothing new
      if (blob === localBlob()) { markSynced(cloudRev, blob); return; } // same data, just re-stamp
      if (hasLocalChanges()) {                  // we have our own unsaved edits -> keep ours, push
        setStatus("pending", "your unsaved edits win; pushing");
        console.log("[sync] local edits pending - keeping ours");
        schedulePush();
        return;
      }
      status.rev = cloudRev;
      setStatus("synced", "got update from your other device");
      console.log("[sync] newer data from another device - adopting (rev " + cloudRev + ")");
      adopt(blob, cloudRev);
    },
    (e) => { setStatus("error", "listener: " + ((e && e.code) || e)); console.error("[sync] listener error:", (e && e.code) || e); }
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
        ready = true; status.rev = cloudRev; setStatus("synced", "loaded newer data from cloud");
        console.log("[sync] adopted cloud copy (rev " + cloudRev + ")");
        return "reload";
      }
      if (blob && local === blob) markSynced(cloudRev, blob); // identical, just re-stamp
    }

    ready = true;
    setStatus(hasLocalChanges() ? "pending" : "synced", hasLocalChanges() ? "uploading your changes" : "up to date");
    if (local != null) await doPush(); // our copy is current or holds unsynced edits
  } catch (e) {
    setStatus("error", "startup: " + ((e && e.code) || e));
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
