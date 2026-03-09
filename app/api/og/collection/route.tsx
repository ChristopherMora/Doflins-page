import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest): ImageResponse {
  const { searchParams } = request.nextUrl;

  const owned = parseInt(searchParams.get("owned") ?? "0", 10);
  const total = parseInt(searchParams.get("total") ?? "0", 10);
  const pct   = total > 0 ? Math.round((owned / total) * 100) : parseInt(searchParams.get("pct") ?? "0", 10);
  const user  = searchParams.get("user") ?? "un coleccionista";

  const barWidth = Math.round(Math.min(pct, 100) * 7.2); // 720px max bar

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(145deg, #fffdf5, #eef5d8)",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "0 80px",
          flexDirection: "column",
          gap: "0",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(78,111,42,0.12) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#4e6f2a",
          color: "white",
          borderRadius: "999px",
          padding: "8px 22px",
          fontSize: "15px",
          fontWeight: "700",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "28px",
        }}>
          <span>🎴</span> DOFLINS
        </div>

        {/* Title */}
        <div style={{
          fontSize: "52px",
          fontWeight: "900",
          color: "#1a2a0a",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "12px",
          display: "flex",
        }}>
          Colección de {user}
        </div>

        {/* Count */}
        <div style={{
          fontSize: "34px",
          fontWeight: "700",
          color: "#4e6f2a",
          marginBottom: "32px",
          display: "flex",
          gap: "8px",
          alignItems: "baseline",
        }}>
          <span style={{ fontSize: "52px", fontWeight: "900" }}>{owned}</span>
          <span style={{ color: "#7a9050" }}>/ {total} figuras</span>
          <span style={{
            background: "#4e6f2a",
            color: "white",
            borderRadius: "999px",
            padding: "6px 18px",
            fontSize: "22px",
            fontWeight: "800",
            marginLeft: "12px",
          }}>{pct}%</span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: "720px",
          height: "16px",
          borderRadius: "999px",
          background: "rgba(78,111,42,0.18)",
          overflow: "hidden",
          display: "flex",
        }}>
          <div style={{
            width: `${barWidth}px`,
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #4e6f2a, #8ab53c)",
            display: "flex",
          }} />
        </div>

        {/* Footer */}
        <div style={{
          position: "absolute",
          bottom: "28px",
          fontSize: "15px",
          color: "#7a8a6a",
          display: "flex",
        }}>
          doflins.dofer.mx · Animals &amp; Multiverse
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
