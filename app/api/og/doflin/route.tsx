import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx";

const RARITY_CONFIG: Record<string, { label: string; color: string; bg: string; glow: string }> = {
  COMMON:    { label: "Común",      color: "#5a6650", bg: "#eef1e8", glow: "#b8c4a8" },
  RARE:      { label: "Raro",       color: "#2e6040", bg: "#e0f3ea", glow: "#90c8a8" },
  EPIC:      { label: "Épico",      color: "#8a4820", bg: "#fdf0e4", glow: "#d89060" },
  LEGENDARY: { label: "Legendario", color: "#7a5010", bg: "#fdf5e0", glow: "#e8c060" },
  ULTRA:     { label: "Ultra",      color: "#8a2020", bg: "#fde8e8", glow: "#e08080" },
  MYTHIC:    { label: "Mítico",     color: "#6020a0", bg: "#f5e0fd", glow: "#c090e0" },
};

export function GET(request: NextRequest): ImageResponse {
  const { searchParams } = request.nextUrl;

  const name    = searchParams.get("name")   ?? "Doflin";
  const rarity  = (searchParams.get("rarity") ?? "COMMON").toUpperCase();
  const imageRaw = searchParams.get("image") ?? "";
  const image   = imageRaw.startsWith("/") ? `${BASE_URL}${imageRaw}` : imageRaw;
  const series  = searchParams.get("series") ?? "Animals";
  const number  = searchParams.get("number") ?? "01";

  const cfg = RARITY_CONFIG[rarity] ?? RARITY_CONFIG["COMMON"]!;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#f6f2df",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left texture strip */}
        <div style={{
          display: "flex",
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: "520px",
          background: `linear-gradient(145deg, ${cfg.bg}, #f6f2df)`,
        }} />

        {/* Glow blob */}
        <div style={{
          display: "flex",
          position: "absolute",
          left: "60px",
          top: "50%",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          transform: "translateY(-50%)",
          background: cfg.glow,
          filter: "blur(80px)",
          opacity: 0.45,
        }} />

        {/* Doflin card */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "absolute",
          left: "80px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "340px",
        }}>
          {/* Image */}
          <div style={{
            display: "flex",
            width: "260px",
            height: "260px",
            borderRadius: "32px",
            overflow: "hidden",
            background: cfg.bg,
            boxShadow: `0 0 0 4px ${cfg.glow}, 0 32px 64px rgba(0,0,0,0.2)`,
          }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                display: "flex",
                width: "100%", height: "100%",
                alignItems: "center", justifyContent: "center",
                fontSize: "80px",
              }}>
                🐾
              </div>
            )}
          </div>

          {/* Rarity badge */}
          <div style={{
            display: "flex",
            marginTop: "16px",
            background: cfg.bg,
            color: cfg.color,
            padding: "6px 20px",
            borderRadius: "99px",
            fontSize: "14px",
            fontWeight: "800",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: `1.5px solid ${cfg.glow}`,
          }}>
            {cfg.label}
          </div>
        </div>

        {/* Right text panel */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          right: "80px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "480px",
          gap: "0",
        }}>
          {/* Serie + número */}
          <div style={{
            display: "flex",
            fontSize: "14px",
            fontWeight: "700",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8a9a70",
            marginBottom: "12px",
          }}>
            Serie {series} · #{number.padStart(2, "0")}
          </div>

          {/* Nombre */}
          <div style={{
            display: "flex",
            fontSize: name.length > 16 ? "52px" : "64px",
            fontWeight: "900",
            color: "#1a2a0a",
            lineHeight: "1.05",
            marginBottom: "20px",
          }}>
            {name}
          </div>

          {/* Separador */}
          <div style={{
            display: "flex",
            width: "60px",
            height: "4px",
            background: cfg.color,
            borderRadius: "4px",
            marginBottom: "24px",
          }} />

          {/* Texto motivador */}
          <div style={{
            display: "flex",
            fontSize: "20px",
            color: "#5a7040",
            fontWeight: "500",
            lineHeight: "1.5",
          }}>
            Acabo de descubrir esta figura en mi colección DOFLINS ✨
          </div>
        </div>

        {/* Footer branding */}
        <div style={{
          display: "flex",
          position: "absolute",
          bottom: "32px",
          right: "80px",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{
            display: "flex",
            fontSize: "16px",
            fontWeight: "900",
            letterSpacing: "0.2em",
            color: "#4e6f2a",
            textTransform: "uppercase",
          }}>
            DOFLINS
          </div>
          <div style={{
            display: "flex",
            fontSize: "14px",
            color: "#8a9a70",
          }}>
            · Colección oficial
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
