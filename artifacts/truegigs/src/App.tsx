import { useEffect, useState } from "react";

export default function App() {
  const hostname = window.location.hostname;
  const expoBase = hostname.includes(".janeway.replit.dev")
    ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
    : hostname.includes(".pike.replit.dev")
    ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
    : `http://localhost:18115`;
  const expoUrl = `${expoBase}/`;

  const [ready, setReady] = useState(false);

  // Ping the Expo server until it's up
  useEffect(() => {
    let cancelled = false;
    async function ping() {
      while (!cancelled) {
        try {
          await fetch(expoUrl, { method: "HEAD", mode: "no-cors" });
          if (!cancelled) setReady(true);
          return;
        } catch {}
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    ping();
    return () => { cancelled = true; };
  }, [expoUrl]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "28px",
        maxWidth: "400px",
        width: "100%",
      }}>
        {/* Logo */}
        <div style={{
          width: "80px", height: "80px", borderRadius: "22px",
          background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", fontWeight: "900", color: "#fff",
          boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
        }}>
          TG
        </div>

        <div>
          <h1 style={{ color: "#fff", margin: "0 0 8px", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            TrueGigs
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", margin: 0, fontSize: "15px" }}>
            Mobile app preview
          </p>
        </div>

        {/* Open button */}
        <a
          href={expoUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "16px 24px",
            borderRadius: "14px",
            background: ready ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "700",
            textDecoration: "none",
            transition: "all 0.2s",
            boxShadow: ready ? "0 4px 20px rgba(37,99,235,0.4)" : "none",
            cursor: ready ? "pointer" : "default",
            pointerEvents: ready ? "auto" : "none",
          }}
        >
          {ready ? "▶  Open App" : "⏳  Starting app…"}
        </a>

        {ready && (
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 }}>
            Opens in a new tab
          </p>
        )}

        {!ready && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTop: "2px solid #6366f1",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 10px",
            }} />
            Bundling your app…
          </div>
        )}
      </div>
    </div>
  );
}
