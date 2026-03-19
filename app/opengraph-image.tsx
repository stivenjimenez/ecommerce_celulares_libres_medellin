import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Celulares Libres Medellín";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #111111 0%, #1a1a2e 100%)",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.15)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.1)",
          display: "flex",
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(99, 102, 241, 0.2)",
          border: "1px solid rgba(99, 102, 241, 0.4)",
          borderRadius: 999,
          padding: "8px 20px",
          marginBottom: 32,
        }}
      >
        <span style={{ color: "#a5b4fc", fontSize: 16, fontWeight: 600 }}>
          📱 Medellín, Colombia
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-2px",
        }}
      >
        Celulares Libres
      </h1>
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#818cf8",
          margin: "4px 0 0 0",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-2px",
        }}
      >
        Medellín
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 24,
          color: "#94a3b8",
          marginTop: 24,
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        Tecnología y accesorios a los mejores precios
      </p>

      {/* Pills */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 40,
        }}
      >
        {[
          "📦 Envío a todo Colombia",
          "✅ Garantía incluida",
          "💳 Múltiples pagos",
        ].map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              padding: "10px 20px",
              color: "#e2e8f0",
              fontSize: 16,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
