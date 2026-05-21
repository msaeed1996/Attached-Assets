import { useState, useEffect, useCallback } from "react";

export default function App() {
  const hostname = window.location.hostname;
  const expoBase = hostname.includes(".janeway.replit.dev")
    ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
    : hostname.includes(".pike.replit.dev")
    ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
    : `http://localhost:18115`;
  const expoUrl = `${expoBase}/`;

  const [phase, setPhase] = useState<"polling" | "ready" | "timeout">("polling");
  const [attempt, setAttempt] = useState(0);
  const [dots, setDots] = useState(".");

  // Animated dots
  useEffect(() => {
    if (phase !== "polling") return;
    const id = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(id);
  }, [phase]);

  // Poll Expo server until it responds
  const poll = useCallback(async () => {
    const start = Date.now();
    const MAX_WAIT = 60_000;
    while (Date.now() - start < MAX_WAIT) {
      try {
        const res = await fetch(expoUrl, { method: "HEAD", mode: "no-cors" });
        // no-cors fetch resolves (opaque response) when server is up
        setPhase("ready");
        return;
      } catch {
        // server not up yet
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    setPhase("timeout");
  }, [expoUrl, attempt]);

  useEffect(() => { poll(); }, [poll]);

  const phoneShell: React.CSSProperties = {
    position: "relative",
    width: "390px",
    height: "844px",
    borderRadius: "54px",
    background: "#1a1a1a",
    boxShadow: "0 0 0 2px #3a3a3a, 0 0 0 6px #1a1a1a, 0 0 0 8px #444, 0 30px 80px rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        TrueGigs · Mobile Preview
      </div>

      <div style={phoneShell}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: "14px", left: "50%",
          transform: "translateX(-50%)", width: "126px", height: "36px",
          background: "#1a1a1a", borderRadius: "20px", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#111" }} />
          <div style={{ width: "56px", height: "8px", borderRadius: "4px", background: "#111" }} />
        </div>

        {/* Home bar */}
        <div style={{
          position: "absolute", bottom: "12px", left: "50%",
          transform: "translateX(-50%)", width: "120px", height: "4px",
          background: "#3a3a3a", borderRadius: "2px",
        }} />

        {/* Screen */}
        <div style={{
          width: "362px", height: "786px", borderRadius: "44px",
          overflow: "hidden", background: "#0f172a", position: "relative",
        }}>
          {/* Polling overlay */}
          {phase !== "ready" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 5,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "18px",
              background: "#0f172a",
            }}>
              {phase === "polling" ? (
                <>
                  <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
                  `}</style>
                  <div style={{
                    width: "48px", height: "48px",
                    borderRadius: "14px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "pulse 1.6s ease-in-out infinite",
                    fontSize: "24px",
                  }}>
                    TG
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#fff", fontSize: "15px", fontWeight: "600" }}>
                      Starting TrueGigs{dots}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "6px" }}>
                      Bundling app, please wait
                    </div>
                  </div>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.1)",
                    borderTop: "3px solid #6366f1",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </>
              ) : (
                <>
                  <div style={{ fontSize: "32px" }}>⚠️</div>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", textAlign: "center", margin: 0, padding: "0 24px" }}>
                    The app server is taking longer than usual.
                  </p>
                  <button
                    onClick={() => { setPhase("polling"); setAttempt((a) => a + 1); }}
                    style={{
                      padding: "10px 24px", borderRadius: "10px",
                      background: "#6366f1", color: "#fff", border: "none",
                      fontSize: "14px", fontWeight: "600", cursor: "pointer",
                    }}
                  >
                    Try Again
                  </button>
                  <a href={expoUrl} target="_blank" rel="noreferrer"
                    style={{ color: "#818cf8", fontSize: "12px" }}>
                    Open app in new tab ↗
                  </a>
                </>
              )}
            </div>
          )}

          {/* The actual iframe — only mounted once server is confirmed up */}
          {phase === "ready" && (
            <iframe
              src={expoUrl}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title="TrueGigs Mobile App"
              allow="camera; microphone; geolocation"
            />
          )}
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
        Live preview · Expo Web
      </div>
    </div>
  );
}
