export default function App() {
  const hostname = window.location.hostname;
  const expoBase = hostname.includes(".janeway.replit.dev")
    ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
    : hostname.includes(".pike.replit.dev")
    ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
    : `http://localhost:18115`;
  const expoUrl = `${expoBase}/`;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        TrueGigs · Mobile Preview
      </div>

      <div
        style={{
          position: "relative",
          width: "390px",
          height: "844px",
          borderRadius: "54px",
          background: "#1a1a1a",
          boxShadow:
            "0 0 0 2px #3a3a3a, 0 0 0 6px #1a1a1a, 0 0 0 8px #444, 0 30px 80px rgba(0,0,0,0.7), inset 0 0 0 2px #2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "126px",
            height: "36px",
            background: "#1a1a1a",
            borderRadius: "20px",
            zIndex: 10,
            boxShadow: "0 0 0 2px #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#111" }} />
          <div style={{ width: "56px", height: "8px", borderRadius: "4px", background: "#111" }} />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "4px",
            background: "#3a3a3a",
            borderRadius: "2px",
          }}
        />

        <div
          style={{
            width: "362px",
            height: "786px",
            borderRadius: "44px",
            overflow: "hidden",
            background: "#fff",
            position: "relative",
          }}
        >
          <iframe
            src={expoUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            title="TrueGigs Mobile App"
          />
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
        Live preview · Expo Web
      </div>
    </div>
  );
}
