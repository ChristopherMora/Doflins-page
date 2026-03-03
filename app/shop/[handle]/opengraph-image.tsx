import { ImageResponse } from "next/og";
import { fetchShopProductByHandle } from "@/lib/server/shopify-storefront";

export const runtime = "nodejs";
export const alt = "Pack DOFLINS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  let title = "Pack DOFLINS";
  let price = "";
  let imageUrl = "";
  let universe = "Animals";
  let available = true;
  let tags: string[] = [];

  try {
    const product = await fetchShopProductByHandle(handle);
    if (product) {
      title = product.title;
      imageUrl = product.imageUrl ?? "";
      universe = product.universe === "multiverse" ? "Multiverse" : "Animals";
      available = product.variants.some((v) => v.availableForSale);
      tags = product.tags ?? [];
      const variant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
      if (variant?.price) {
        const val = Number(variant.price.amount);
        if (Number.isFinite(val)) {
          price = new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: variant.price.currencyCode,
            maximumFractionDigits: 0,
          }).format(val);
        }
      }
    }
  } catch {
    // fallback values used
  }

  const rarityTag = tags.find((t) =>
    /legendary|epic|rare|especial|uncommon|ultra|mythic/i.test(t),
  );

  const bgGradient =
    universe === "Multiverse"
      ? "linear-gradient(145deg, #1a1b3a 0%, #2a2055 50%, #1e1a48 100%)"
      : "linear-gradient(145deg, #1f2a1a 0%, #2d4422 50%, #1a2914 100%)";

  const accentColor = universe === "Multiverse" ? "#7c8fe8" : "#8ab53c";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          background: bgGradient,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          }}
        />

        {/* Left: text content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 50px",
            gap: "18px",
          }}
        >
          {/* DOFLINS logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, #4e6f2a, ${accentColor})`,
                borderRadius: "12px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "900",
                fontSize: "16px",
              }}
            >
              DF
            </div>
            <span
              style={{ color: "#fff", fontWeight: "800", fontSize: "22px", letterSpacing: "-0.5px" }}
            >
              DOFLINS
            </span>
          </div>

          {/* Universe badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: `${accentColor}25`,
              border: `1px solid ${accentColor}66`,
              borderRadius: "99px",
              padding: "6px 16px",
              width: "fit-content",
            }}
          >
            <span style={{ color: accentColor, fontWeight: "700", fontSize: "14px", textTransform: "uppercase", letterSpacing: "2px" }}>
              {universe}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              color: "#f6f2df",
              fontWeight: "800",
              fontSize: title.length > 30 ? "46px" : "58px",
              lineHeight: 1.05,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </div>

          {/* Rarity tag */}
          {rarityTag && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#D59A1A22",
                border: "1px solid #D59A1A88",
                borderRadius: "8px",
                padding: "6px 14px",
                width: "fit-content",
                color: "#f0c855",
                fontWeight: "700",
                fontSize: "15px",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              ★ {rarityTag}
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "8px" }}>
            {price && (
              <span style={{ color: "#fff", fontWeight: "800", fontSize: "44px" }}>
                {price}
              </span>
            )}
            <span
              style={{
                color: available ? "#7ec85a" : "#e08080",
                fontWeight: "600",
                fontSize: "16px",
                background: available ? "#7ec85a22" : "#e0808022",
                border: `1px solid ${available ? "#7ec85a88" : "#e0808088"}`,
                borderRadius: "99px",
                padding: "4px 14px",
              }}
            >
              {available ? "Disponible" : "Agotado"}
            </span>
          </div>
        </div>

        {/* Right: product image */}
        {imageUrl && (
          <div
            style={{
              width: "380px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                maxWidth: "100%",
                maxHeight: "460px",
                objectFit: "contain",
                filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.6))",
              }}
            />
          </div>
        )}

        {/* Bottom brand strip */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "5px",
            background: `linear-gradient(90deg, #4e6f2a, ${accentColor}, #4e6f2a)`,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
