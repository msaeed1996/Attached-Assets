export default function App() {
  const hostname = window.location.hostname;
  const expoBase = hostname.includes(".janeway.replit.dev")
    ? `https://${hostname.replace(".janeway.replit.dev", ".expo.janeway.replit.dev")}`
    : hostname.includes(".pike.replit.dev")
    ? `https://${hostname.replace(".pike.replit.dev", ".expo.pike.replit.dev")}`
    : `http://localhost:18115`;

  return (
    <iframe
      src={expoBase}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
      allow="camera; microphone; geolocation"
    />
  );
}
