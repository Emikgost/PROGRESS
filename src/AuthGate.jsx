// AuthGate.jsx  — v6
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { initialSync, installCloudSync, stopCloudSync } from "./cloud";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState("checking");
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Bumping this remounts the app so it re-reads the freshly synced data.
  // (We no longer reload the page — that used to skip installCloudSync() entirely,
  //  which is why one device would never upload its changes.)
  const [dataKey, setDataKey] = useState(0);

  useEffect(() => {
    const onAdopted = () => setDataKey((k) => k + 1);
    window.addEventListener("cloud-adopted", onAdopted);
    return () => window.removeEventListener("cloud-adopted", onAdopted);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setPhase("syncing");
        try {
          await initialSync(u.uid);
        } catch (e) {
          console.error("[sync] initialSync threw:", e);
        }
        installCloudSync();   // ALWAYS — this is what enables uploading.
        setUser(u);
        setPhase("ready");
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
    return (
      <div style={S.center}>
        <div style={S.spinner} />
        <div style={{ color: "#8A94A6", fontSize: 13, marginTop: 14, fontFamily: "system-ui, sans-serif" }}>
          {phase === "syncing" ? "Syncing your data…" : "Loading…"}
        </div>
      </div>
    );
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

const S = {
  center: { position: "fixed", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#0B0F17", padding: 20 },
  card: { width: "100%", maxWidth: 360, background: "#141A24", border: "1px solid #222B38",
    borderRadius: 18, padding: "32px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    fontFamily: "system-ui, sans-serif" },
  brand: { fontSize: 24, fontWeight: 800, color: "#34E29B", letterSpacing: "0.18em",
    textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#8A94A6", textAlign: "center", marginBottom: 24 },
  input: { width: "100%", boxSizing: "border-box", background: "#0B0F17", border: "1px solid #222B38",
    borderRadius: 10, padding: "13px 14px", color: "#EAF0F6", fontSize: 15, marginBottom: 10, outline: "none" },
  button: { width: "100%", background: "#0AA063", border: "none", borderRadius: 10, padding: "14px 0",
    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 6 },
  error: { background: "#3A1620", color: "#FF9AA8", fontSize: 12, borderRadius: 8,
    padding: "9px 11px", marginBottom: 10, lineHeight: 1.4 },
  switch: { textAlign: "center", fontSize: 12.5, color: "#8A94A6", marginTop: 18 },
  link: { color: "#34E29B", cursor: "pointer", fontWeight: 600 },
  spinner: { width: 28, height: 28, borderRadius: "50%", border: "3px solid #222B38",
    borderTopColor: "#34E29B", animation: "spin 0.8s linear infinite" },
};

if (typeof document !== "undefined" && !document.getElementById("authgate-kf")) {
  const s = document.createElement("style");
  s.id = "authgate-kf";
  s.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(s);
}
