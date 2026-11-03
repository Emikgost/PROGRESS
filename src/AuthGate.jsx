// AuthGate.jsx  — v7 (local-first + branded loader)
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { initialSync, installCloudSync, stopCloudSync } from "./cloud";

const STORE_KEY = "dash-v18";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("checking"); // checking | syncing | ready | signedout
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Bumping this remounts the app so it re-reads freshly synced data (dispatched by cloud.js on adopt).
  const [dataKey, setDataKey] = useState(0);

  useEffect(() => {
    const onAdopted = () => setDataKey((k) => k + 1);
    window.addEventListener("cloud-adopted", onAdopted);
    return () => window.removeEventListener("cloud-adopted", onAdopted);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // LOCAL-FIRST: if we already have data cached locally, render the app immediately and let
        // the cloud reconcile in the background (it remounts us via "cloud-adopted" if it pulls a
        // newer copy). Only the very first load on a brand-new device waits for the cloud, since
        // there is nothing local to show yet.
        const hasLocal = !!localStorage.getItem(STORE_KEY);
        if (hasLocal) {
          initialSync(u.uid).catch((e) => console.error("[sync] background initialSync:", e));
          installCloudSync();
          setUser(u);
          setPhase("ready");
        } else {
          setPhase("syncing");
          try {
            await initialSync(u.uid);
          } catch (e) {
            console.error("[sync] initialSync threw:", e);
          }
          installCloudSync();
          setUser(u);
          setPhase("ready");
        }
      } else {
        stopCloudSync();
        setUser(null);
        setPhase("signedout");
      }
    });
    return unsub;
  }, []);

  const submit = async () => {
    setErr("");
    if (!email.trim() || !pw) { setErr("Enter an email and password."); return; }
    setBusy(true);
    try {
      if (mode === "signin") await signInWithEmailAndPassword(auth, email.trim(), pw);
      else await createUserWithEmailAndPassword(auth, email.trim(), pw);
    } catch (e) {
      setErr((e.message || "Something went wrong.").replace("Firebase:", "").trim());
      setBusy(false);
    }
  };

  if (phase === "checking" || phase === "syncing") {
    return <BrandLoader label={phase === "syncing" ? "Syncing your data…" : "Getting things ready…"} />;
  }

  // key={dataKey} => when the cloud hands us newer data, the app remounts and reads it.
  if (user) return <div key={dataKey} style={{ display: "contents" }}>{children}</div>;

  return (
    <div style={S.center}>
      <div style={S.card}>
        <div style={S.brand}>PROGRESS</div>
        <div style={S.subtitle}>
          {mode === "signin" ? "Sign in to sync your data" : "Create an account to sync your data"}
        </div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoCapitalize="none" style={S.input}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Password (6+ characters)" style={S.input}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div style={S.error}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...S.button, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
        <div style={S.switch}>
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <span style={S.link} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); }}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Branded, seamless-looping loader: the PROGRESS wordmark with a shimmering green sweep over an
//    equalizer of bars that rise and fall — reads as "actively syncing" and loops forever cleanly. ──
function BrandLoader({ label }) {
  return (
    <div style={S.loadWrap}>
      <div style={{ textAlign: "center" }}>
        <div style={S.loadBars}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ ...S.loadBar, animationDelay: `${i * 0.13}s` }} />
          ))}
        </div>
        <div style={S.loadBrand}>PROGRESS</div>
        <div style={S.loadCaption}>{label}</div>
      </div>
    </div>
  );
}

const GREEN = "#32D583";
const S = {
  center: { position: "fixed", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#080B10", padding: 20 },
  card: { width: "100%", maxWidth: 360, background: "#141A24", border: "1px solid #222B38",
    borderRadius: 18, padding: "32px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    fontFamily: "system-ui, sans-serif" },
  brand: { fontSize: 24, fontWeight: 800, color: GREEN, letterSpacing: "0.18em",
    textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#8A94A6", textAlign: "center", marginBottom: 24 },
  input: { width: "100%", boxSizing: "border-box", background: "#0B0F17", border: "1px solid #222B38",
    borderRadius: 10, padding: "13px 14px", color: "#EAF0F6", fontSize: 15, marginBottom: 10, outline: "none" },
  button: { width: "100%", background: "linear-gradient(135deg,#32D583 0%,#12B76A 100%)", border: "none",
    borderRadius: 10, padding: "14px 0", color: "#07140D", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 6 },
  error: { background: "#3A1620", color: "#FF9AA8", fontSize: 12, borderRadius: 8,
    padding: "9px 11px", marginBottom: 10, lineHeight: 1.4 },
  switch: { textAlign: "center", fontSize: 12.5, color: "#8A94A6", marginTop: 18 },
  link: { color: GREEN, cursor: "pointer", fontWeight: 600 },
  // Loader
  loadWrap: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
    background: "#080B10", fontFamily: "system-ui, sans-serif" },
  loadBars: { display: "flex", gap: 6, height: 38, alignItems: "flex-end", justifyContent: "center", marginBottom: 20 },
  loadBar: { width: 7, height: "100%", borderRadius: 4, background: "linear-gradient(180deg,#5BE49B,#12B76A)",
    transformOrigin: "bottom", animation: "pgBar 1s ease-in-out infinite" },
  loadBrand: { fontSize: 22, fontWeight: 800, letterSpacing: "0.24em", textAlign: "center",
    backgroundImage: "linear-gradient(90deg,#166E49 0%,#32D583 40%,#9BF3C6 50%,#32D583 60%,#166E49 100%)",
    backgroundSize: "220% 100%", WebkitBackgroundClip: "text", backgroundClip: "text",
    WebkitTextFillColor: "transparent", color: "transparent", animation: "pgShim 2.4s linear infinite" },
  loadCaption: { color: "#8A94A6", fontSize: 12.5, marginTop: 14, letterSpacing: "0.02em" },
};

if (typeof document !== "undefined" && !document.getElementById("authgate-kf")) {
  const s = document.createElement("style");
  s.id = "authgate-kf";
  s.textContent =
    "@keyframes spin{to{transform:rotate(360deg)}}" +
    "@keyframes pgBar{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}" +
    "@keyframes pgShim{0%{background-position:110% 0}100%{background-position:-110% 0}}";
  document.head.appendChild(s);
}
