export default function App() {
  const expoUrl =
    "https://e227759e-480f-4a7f-970c-5dd8ddc3b2bc-00-371w85l4vfmh.expo.pike.replit.dev/login";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#fff",
        padding: "24px",
        textAlign: "center",
        gap: "32px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            fontWeight: "900",
            color: "#22c55e",
            boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
            letterSpacing: "-2px",
          }}
        >
          TG
        </div>
        <h1 style={{ fontSize: "36px", fontWeight: "800", margin: 0, letterSpacing: "-1px" }}>
          TrueGigs
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: "320px" }}>
          The platform connecting gig workers with employers — fast, reliable, trusted.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <a
          href={expoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff",
            textDecoration: "none",
            padding: "16px 32px",
            borderRadius: "14px",
            fontWeight: "700",
            fontSize: "16px",
            boxShadow: "0 4px 24px rgba(37,99,235,0.4)",
            transition: "transform 0.15s",
          }}
        >
          Open Mobile App →
        </a>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          Opens the live mobile app preview
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "32px",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "480px",
        }}
      >
        {[
          { icon: "💼", label: "Find Gigs", desc: "Browse open shifts & jobs" },
          { icon: "📅", label: "Set Availability", desc: "Control your schedule" },
          { icon: "💬", label: "Instant Messages", desc: "Chat with employers" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px",
              flex: "1",
              minWidth: "120px",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>{item.icon}</div>
            <div style={{ fontWeight: "600", fontSize: "13px" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
