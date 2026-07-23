import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const hostname = window.location.hostname;
    const expoUrl = hostname.includes(".janeway.replit.dev")
      ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
      : hostname.includes(".pike.replit.dev")
      ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
      : `http://localhost:18115`;

    window.location.href = expoUrl;
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a2980",
        color: "#fff",
        fontFamily: "sans-serif",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid rgba(255,255,255,0.3)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
        Loading TrueGigs…
      </div>
    </div>
  );
}
