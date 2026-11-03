// cloud.js
import { auth, db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const META_KEY = "dash-v18-sync"; // { rev, editedAt } — persisted sync baseline (survives reloads)
const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;
let pushing = false;
let pendingWhilePushing = false;

// ── Sync baseline, persisted in localStorage so it is NOT lost on reload ──
// rev      = the cloud revision our local blob currently corresponds to
// editedAt = wall-clock time of the last LOCAL edit (set only when the app writes, never when we adopt the cloud)
function getMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {}; }
  catch (e) { return {}; }
}
function setMeta(patch) {
  const m = { ...getMeta(), ...patch };
  try { nativeSet(META_KEY, JSON.stringify(m)); } catch (e) {}
  return m;
}

// Optional tiny status badge hook (kept compatible with the app's existing badge toggle).
function badge(state) {
  try {
    if (localStorage.getItem("sync-badge-visible") !== "1") return;
    let el = document.getElementById("sync-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "sync-badge";
      el.style.cssText =
        "position:fixed;bottom:10px;right:10px;z-index:9999;font:600 10px -apple-system,sans-serif;" +
        "padding:4px 9px;border-radius:12px;pointer-events:none;transition:opacity .3s ease;backdrop-filter:blur(6px);";
      document.body.appendChild(el);
    }
    const map = {
      syncing: ["Syncing…", "rgba(50,213,131,0.18)", "#32D583"],
      synced:  ["Synced",   "rgba(50,213,131,0.12)", "#32D583"],
      offline: ["Offline",  "rgba(255,159,10,0.16)", "#FF9F0A"],
      error:   ["Sync error","rgba(255,69,58,0.16)", "#FF453A"],
    };
    const [label, bg, fg] = map[state] || map.synced;
    el.textContent = "● " + label;
    el.style.background = bg;
    el.style.color = fg;
    el.style.opacity = state === "synced" ? "0" : "1";
  } catch (e) {}
}

function adopt(blob, rev, editedAt) {
  nativeSet(STORE_KEY, blob);
  setMeta({ rev, editedAt });
  // Tell AuthGate to remount the app so React re-reads the freshly adopted data (no full page reload).
  try { window.dispatchEvent(new Event("cloud-adopted")); } catch (e) {}
}

// Push always re-reads the cloud's CURRENT rev inside the transaction and writes rev+1, so it can't
// deadlock. It records the new rev as our baseline. editedAt is left untouched (it tracks local edits).
async function doPush() {
  if (!currentUid || !ready) return;
  if (pushing) { pendingWhilePushing = true; return; }
  const blob = localStorage.getItem(STORE_KEY);
  if (blob == null) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) { badge("offline"); return; }
  pushing = true;
  badge("syncing");
  const ref = doc(db, "users", currentUid);
  try {
    const newRev = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cloudRev = snap.exists() ? (snap.data().rev || 0) : 0;
      const next = cloudRev + 1;
      tx.set(ref, { blob, rev: next, updatedAt: Date.now() });
      return next;
    });
    setMeta({ rev: newRev });
    badge("synced");
  } catch (e) {
    badge("error");
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
  // Patch setItem so the app's own writes (a) stamp the local edit time and (b) schedule a push.
  const patched = (key, value) => {
    nativeSet(key, value);
    if (key === STORE_KEY) {
      setMeta({ editedAt: Date.now() });
      schedulePush();
    }
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

// On login: reconcile local vs cloud with timestamp-aware, last-edit-wins resolution.
//
// Returns "reload" when it adopted a newer cloud copy (the caller should reload so React re-reads
// localStorage), otherwise "ok". It NEVER blocks on the upload — the push is scheduled in the
// background so the app can render immediately from the local cache (local-first).
export async function initialSync(uid) {
  currentUid = uid;
  const localBlob = localStorage.getItem(STORE_KEY);
  const meta = getMeta();
  const baselineRev = meta.rev || 0;
  const localEditedAt = meta.editedAt || 0;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data() || {};
      const cloudBlob = data.blob;
      const cloudRev = data.rev || 0;
      const cloudUpdatedAt = data.updatedAt || 0;

      // 1. Brand-new device (no local data) → always adopt the cloud copy.
      if (cloudBlob && localBlob == null) {
        adopt(cloudBlob, cloudRev, cloudUpdatedAt);
        ready = true;
        return "reload";
      }

      // 2. Cloud has a revision we've never seen (another device wrote after us).
      if (cloudBlob && cloudRev > baselineRev) {
        // Keep local ONLY if our local edits are strictly newer than the cloud write. Read the edit
        // time LIVE (not the pre-render baseline) so edits made during the sync window are never
        // discarded by adopting an older cloud copy.
        const liveEditedAt = (getMeta().editedAt || 0);
        const localIsNewer = Math.max(localEditedAt, liveEditedAt) > cloudUpdatedAt;
        if (localIsNewer) {
          // Our edits win; record the cloud rev as our base so the push lands as cloudRev+1.
          setMeta({ rev: cloudRev });
        } else {
          // Cloud is genuinely newer and we have no newer local edits → adopt it (no clobber).
          adopt(cloudBlob, cloudRev, cloudUpdatedAt);
          ready = true;
          return "reload";
        }
      } else {
        // We are level with or ahead of the cloud; keep our baseline in sync.
        setMeta({ rev: Math.max(baselineRev, cloudRev) });
      }
    }
    ready = true;
    // Local-first: don't await the upload. Push our copy up in the background so the cloud is current.
    schedulePush();
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
