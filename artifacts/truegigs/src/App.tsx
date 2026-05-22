import { useEffect } from "react";

export default function App() {
  const hostname = window.location.hostname;
  const expoBase = hostname.includes(".janeway.replit.dev")
    ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
    : hostname.includes(".pike.replit.dev")
    ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
    : `http://localhost:18115`;
  const expoUrl = `${expoBase}/`;

  useEffect(() => {
    window.location.replace(expoUrl);
  }, [expoUrl]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.15)",
        borderTop: "3px solid #6366f1",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
        Loading TrueGigs…
      </div>
    </div>
  );
}
