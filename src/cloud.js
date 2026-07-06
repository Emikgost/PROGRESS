// cloud.js
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORE_KEY = "dash-v18";
const TS_KEY = "dash-cloud-ts";

const nativeSet = localStorage.setItem.bind(localStorage);

let currentUid = null;
let ready = false;
let pushTimer = null;

function localTs() {
  return Number(localStorage.getItem(TS_KEY) || 0);
}
function setLocalTs(ts) {
  nativeSet(TS_KEY, String(ts));
}

function schedulePush() {
  if (!currentUid || !ready) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const blob = localStorage.getItem(STORE_KEY);
    if (blob == null) return;
    const ts = Date.now();
    try {
      await setDoc(doc(db, "users", currentUid), { blob, updatedAt: ts });
      setLocalTs(ts);
    } catch (e) {
      console.error("Cloud push failed (will retry on next save):", e);
    }
  }, 1500);
}

export function installCloudSync() {
  if (localStorage.setItem.__cloudPatched) return;
  const patched = (key, value) => {
    nativeSet(key, value);
    if (key === STORE_KEY) schedulePush();
  };
  patched.__cloudPatched = true;
  localStorage.setItem = patched;
}

export async function initialSync(uid) {
  currentUid = uid;
  try {
    const snap = await getDoc(doc(db, "users", uid));
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
      await setDoc(doc(db, "users", uid), { blob: localBlob, updatedAt: ts });
      setLocalTs(ts);
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
