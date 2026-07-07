// cloud.js
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const TS_KEY = "dash-cloud-ts";
const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;

function localTs() { return Number(localStorage.getItem(TS_KEY) || 0); }
function setLocalTs(ts) { nativeSet(TS_KEY, String(ts)); }

// With offline persistence on (firebase.js), this write goes to a durable on-device queue
// and retries automatically until it reaches the server. Not awaited, so a dropped
// connection never blocks the app.
function doPush() {
  if (!currentUid || !ready) return;
  const blob = localStorage.getItem(STORE_KEY);
  if (blob == null) return;
  const ts = Date.now();
  setLocalTs(ts);
  setDoc(doc(db, "users", currentUid), { blob, updatedAt: ts })
    .catch((e) => console.error("Cloud push queued/failed:", e));
}

function schedulePush() {
  if (!currentUid || !ready) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(doPush, 1500);
}

// Fix 2: push immediately when the app is backgrounded / locked / closed.
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
  }
}

export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid)); // resolves from cache when offline
    if (snap.exists()) {
      const { blob, updatedAt } = snap.data();
      if (blob && updatedAt > localTs()) {
        nativeSet(STORE_KEY, blob);
        setLocalTs(updatedAt);
        ready = true;
        return "reload";
      }
    }
    const localBlob = localStorage.getItem(STORE_KEY);
    if (localBlob != null) {
      const ts = Date.now();
      setLocalTs(ts);
      setDoc(doc(db, "users", uid), { blob: localBlob, updatedAt: ts })
        .catch((e) => console.error("Initial push queued/failed:", e));
    }
  } catch (e) {
    console.error("Initial sync failed (using local data for now):", e);
  }
  ready = true;
  return "ok";
}

export function stopCloudSync() {
  currentUid = null;
  ready = false;
  clearTimeout(pushTimer);
}
