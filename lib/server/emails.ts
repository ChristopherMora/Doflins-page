import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "DOFLINS <noreply@doflins.dofer.mx>";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx").replace(/\/$/, "");
const LOGO_URL = `${SITE_URL}/images/branding/doflins-email-logo.png`;

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(RESEND_API_KEY);
  }
  return resendInstance;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    throw new Error("RESEND_API_KEY no está configurada.");
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      throw new Error(error.message || "Resend rechazo el envio.");
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    if (err instanceof Error && err.message.trim()) {
      throw err;
    }
    throw new Error("Fallo el envio del correo.");
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

function pointsChip(label: string, value: string, tone: "green" | "gold" | "blue" | "rose" = "green"): string {
  const tones = {
    green: {
      bg: "#e8f5df",
      border: "#c6dfaa",
      text: "#2f5b1f",
    },
    gold: {
      bg: "#fff4d8",
      border: "#ecd28c",
      text: "#7d5a00",
    },
    blue: {
      bg: "#e8efff",
      border: "#c8d5ff",
      text: "#2840a0",
    },
    rose: {
      bg: "#fde8f5",
      border: "#f5c4e7",
      text: "#8c1d78",
    },
  } as const;

  const palette = tones[tone];
  return `<td class="stack-col" style="padding:0 6px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${palette.bg};border:1px solid ${palette.border};border-radius:16px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${palette.text};opacity:0.85;font-weight:800;">
            ${escapeHtml(label)}
          </p>
          <p style="margin:0;font-size:22px;line-height:1.1;color:${palette.text};font-weight:900;">
            ${escapeHtml(value)}
          </p>
        </td>
      </tr>
    </table>
  </td>`;
}

function ctaButton(text: string, href: string, accent: { from: string; to: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${accent.from},${accent.to});color:#ffffff;padding:14px 26px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:-0.01em;">
          ${escapeHtml(text)}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoCard(content: string, tone: "neutral" | "green" | "gold" | "blue" | "rose" = "neutral"): string {
  const tones = {
    neutral: { bg: "#f7f6f1", border: "#e6e1d1" },
    green: { bg: "#eef7e4", border: "#cfe4b1" },
    gold: { bg: "#fff6e2", border: "#ead29c" },
    blue: { bg: "#eef3ff", border: "#cad8ff" },
    rose: { bg: "#fff0f8", border: "#f2cce4" },
  } as const;

  const palette = tones[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;background:${palette.bg};border:1px solid ${palette.border};border-radius:18px;">
    <tr>
      <td style="padding:18px 18px 16px;">
        ${content}
      </td>
    </tr>
  </table>`;
}

function splitComparison(leftLabel: string, leftValue: string, rightLabel: string, rightValue: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;background:#fbfaf7;border:1px solid #e7e1d3;border-radius:18px;">
    <tr>
      <td class="stack-col" width="48%" style="padding:18px 18px 16px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b846e;font-weight:800;">${escapeHtml(leftLabel)}</p>
        <p style="margin:0;font-size:22px;line-height:1.2;color:#202420;font-weight:900;">${escapeHtml(leftValue)}</p>
      </td>
      <td class="hide-mobile" width="4%" style="padding:18px 0 16px;text-align:center;font-size:20px;color:#a6a08a;font-weight:800;">⇄</td>
      <td class="stack-col" width="48%" style="padding:18px 18px 16px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b846e;font-weight:800;">${escapeHtml(rightLabel)}</p>
        <p style="margin:0;font-size:22px;line-height:1.2;color:#202420;font-weight:900;">${escapeHtml(rightValue)}</p>
      </td>
    </tr>
  </table>`;
}

function progressBar(percent: number): string {
  const safePercent = Math.max(0, Math.min(100, percent));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 0;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ebe7da;border-radius:999px;">
          <tr>
            <td style="height:12px;border-radius:999px;background:linear-gradient(135deg,#4e6f2a,#8bb94a);width:${safePercent}%;"></td>
            <td style="height:12px;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

interface LayoutOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  accent: {
    from: string;
    to: string;
    glow: string;
  };
  body: string;
}

function emailLayout(opts: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f3efe5;
      font-family: Inter, Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #202420;
    }
    table {
      border-collapse: separate;
    }
    .preheader {
      display: none;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      mso-hide: all;
      visibility: hidden;
    }
    @media screen and (max-width: 620px) {
      .shell {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .hero,
      .content,
      .footer {
        padding-left: 22px !important;
        padding-right: 22px !important;
      }
      .stack-col,
      .stack-col td {
        display: block !important;
        width: 100% !important;
      }
      .hide-mobile {
        display: none !important;
      }
      .hero-title {
        font-size: 30px !important;
        line-height: 1.02 !important;
      }
      .content-copy {
        font-size: 15px !important;
      }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe5;">
    <tr>
      <td class="shell" align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fffdf9;border:1px solid #ddd5c0;border-radius:28px;overflow:hidden;box-shadow:0 24px 70px rgba(24,33,16,0.08);">
          <tr>
            <td class="hero" style="padding:28px 32px 30px;background:
              radial-gradient(circle at top right, ${opts.accent.glow} 0%, rgba(255,255,255,0) 42%),
              linear-gradient(135deg, ${opts.accent.from}, ${opts.accent.to});">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" style="background:rgba(3,5,3,0.52);border:1px solid rgba(255,255,255,0.12);border-radius:22px;box-shadow:0 16px 44px rgba(3,8,2,0.22);">
                            <tr>
                              <td style="padding:10px 18px;">
                                <img
                                  src="${escapeHtml(LOGO_URL)}"
                                  alt="DOFLINS"
                                  width="220"
                                  style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"
                                />
                              </td>
                            </tr>
                          </table>
                          <p style="margin:10px 0 0 2px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:800;">
                            ${escapeHtml(opts.eyebrow)}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <h1 class="hero-title" style="margin:0 0 10px;font-size:38px;line-height:0.98;color:#ffffff;font-weight:900;letter-spacing:-0.05em;">
                      ${escapeHtml(opts.title)}
                    </h1>
                    <p style="margin:0;max-width:470px;font-size:16px;line-height:1.6;color:rgba(255,255,255,0.88);font-weight:500;">
                      ${escapeHtml(opts.intro)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding:30px 32px 8px;background:#fffdf9;">
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td class="footer" style="padding:22px 32px 28px;background:#f7f4ec;border-top:1px solid #e8e1cf;">
              <p style="margin:0;font-size:13px;color:#67604e;line-height:1.6;">
                Hecho para coleccionistas que quieren ver su progreso, descubrir rarezas y seguir sumando figuras con estilo.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#8a836f;line-height:1.6;">
                <a href="${SITE_URL}" style="color:#4e6f2a;text-decoration:none;font-weight:800;">doflins.dofer.mx</a>
                &nbsp;&nbsp;•&nbsp;&nbsp;
                <a href="${SITE_URL}/notificaciones" style="color:#4e6f2a;text-decoration:none;font-weight:700;">Preferencias de correo</a>
                &nbsp;&nbsp;•&nbsp;&nbsp;
                <a href="${SITE_URL}/faq" style="color:#4e6f2a;text-decoration:none;font-weight:700;">FAQ</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPurchaseConfirmation(opts: {
  to: string;
  orderTotal: string;
  pointsAwarded: number;
  referralBonus?: number;
}): Promise<boolean> {
  const rewardChips = [
    pointsChip("Pedido confirmado", `$${escapeHtml(opts.orderTotal)} MXN`, "gold"),
    pointsChip("Puntos ganados", `+${formatNumber(opts.pointsAwarded)}`, "green"),
    ...(opts.referralBonus
      ? [pointsChip("Bonus referido", `+${formatNumber(opts.referralBonus)}`, "blue")]
      : []),
  ].join("");

  const html = emailLayout({
    preheader: "Tu compra fue confirmada y tus puntos DOFLINS ya quedaron registrados.",
    eyebrow: "Compra confirmada",
    title: "Tu pack ya forma parte de la coleccion.",
    intro: `Recibimos tu compra por $${opts.orderTotal} MXN. Ahora toca esperar el pack y prepararte para revelar lo que viene dentro.`,
    accent: {
      from: "#375f1d",
      to: "#7aa73d",
      glow: "rgba(222,255,173,0.34)",
    },
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        <tr>
          ${rewardChips}
        </tr>
      </table>

      ${infoCard(`
        <p class="content-copy" style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#495043;">
          Tu compra ya quedo registrada en DOFLINS. En cuanto recibas tu bolsa, escanea el codigo para revelar la figura, guardarla en tu coleccion y seguir subiendo puntos.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6d6553;">
          Si usaste un codigo referido, el bonus ya esta contemplado en tu correo. Si no, tus puntos base de compra tambien quedaron contabilizados.
        </p>
      `, "green")}

      ${infoCard(`
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7d765f;font-weight:800;">
          Que sigue
        </p>
        <p style="margin:0 0 10px;font-size:15px;color:#202420;font-weight:800;">1. Recibe tu pack</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#5c5646;">Cuando tengas tu bolsa contigo, entra a la experiencia de reveal.</p>
        <p style="margin:0 0 10px;font-size:15px;color:#202420;font-weight:800;">2. Escanea tu codigo</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#5c5646;">El sistema te mostrara exactamente que figura obtuviste.</p>
        <p style="margin:0;font-size:15px;color:#202420;font-weight:800;">3. Guarda tu progreso</p>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:#5c5646;">Agrega la figura a tu coleccion y sigue avanzando en ranking, logros y recompensas.</p>
      `, "neutral")}

      ${ctaButton("Ir a revelar mis figuras", `${SITE_URL}/reveal`, { from: "#3f6923", to: "#86b545" })}
    `,
  });

  return sendEmail({ to: opts.to, subject: "Tu compra en DOFLINS ya fue confirmada", html });
}

export async function sendTradeOfferNotification(opts: {
  to: string;
  offererName: string;
  offeredFigureName: string;
  yourFigureName: string;
  listingId: number;
}): Promise<boolean> {
  const html = emailLayout({
    preheader: "Tienes una nueva oferta de intercambio en DOFLINS.",
    eyebrow: "Intercambio activo",
    title: "Te llego una nueva oferta.",
    intro: `${opts.offererName} quiere intercambiar contigo y ya dejo una propuesta lista para revisar.`,
    accent: {
      from: "#7a4a16",
      to: "#d08b2f",
      glow: "rgba(255,220,164,0.34)",
    },
    body: `
      ${splitComparison("Te ofrecen", opts.offeredFigureName, "Por tu figura", opts.yourFigureName)}

      ${infoCard(`
        <p class="content-copy" style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#495043;">
          Revisa la propuesta y decide si te conviene aceptar, rechazar o seguir buscando una mejor combinacion para completar tu coleccion.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6d6553;">
          El marketplace de intercambios esta pensado para que muevas tus repetidas y acerques tu album a las rarezas que te faltan.
        </p>
      `, "gold")}

      ${infoCard(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="stack-col" width="50%" style="padding:0 8px 8px 0;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b846e;font-weight:800;">Estado</p>
              <p style="margin:0;font-size:18px;color:#202420;font-weight:900;">Pendiente</p>
            </td>
            <td class="stack-col" width="50%" style="padding:0 0 8px 8px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b846e;font-weight:800;">Listado</p>
              <p style="margin:0;font-size:18px;color:#202420;font-weight:900;">#${escapeHtml(String(opts.listingId))}</p>
            </td>
          </tr>
        </table>
      `, "neutral")}

      ${ctaButton("Ver oferta en intercambios", `${SITE_URL}/intercambios`, { from: "#91531a", to: "#e19a37" })}
    `,
  });

  return sendEmail({ to: opts.to, subject: `${opts.offererName} quiere intercambiar contigo`, html });
}

export async function sendWeeklyDigest(opts: {
  to: string;
  displayName: string;
  pointsBalance: number;
  collectionCount: number;
  totalFigures: number;
  newTradeOffers: number;
  topRarity?: string;
}): Promise<boolean> {
  const completionPct = opts.totalFigures > 0
    ? Math.round((opts.collectionCount / opts.totalFigures) * 100)
    : 0;
  const remaining = Math.max(0, opts.totalFigures - opts.collectionCount);

  const topRarityLabel = opts.topRarity ?? "Sin rareza destacada";

  const html = emailLayout({
    preheader: "Tu resumen semanal DOFLINS ya esta listo.",
    eyebrow: "Resumen semanal",
    title: "Asi va tu progreso esta semana.",
    intro: `Hola${opts.displayName ? `, ${opts.displayName}` : ""}. Aqui tienes una vista rapida de tu coleccion, tus puntos y lo que se movio en los ultimos dias.`,
    accent: {
      from: "#24405f",
      to: "#5176b8",
      glow: "rgba(190,214,255,0.34)",
    },
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        <tr>
          ${pointsChip("Coleccion", `${formatNumber(opts.collectionCount)}/${formatNumber(opts.totalFigures)}`, "green")}
          ${pointsChip("Puntos", formatNumber(opts.pointsBalance), "blue")}
        </tr>
        <tr>
          ${pointsChip("Ofertas nuevas", formatNumber(opts.newTradeOffers), "gold")}
          ${pointsChip("Mejor rareza", topRarityLabel, "rose")}
        </tr>
      </table>

      ${infoCard(`
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6f7b96;font-weight:800;">
          Avance general
        </p>
        <p style="margin:0;font-size:26px;line-height:1;color:#1d2942;font-weight:900;">${completionPct}% completado</p>
        ${progressBar(completionPct)}
        <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#566071;">
          ${remaining > 0
            ? `Te faltan ${formatNumber(remaining)} figuras para completar la coleccion actual.`
            : "Ya completaste toda la coleccion actual. Momento de presumir ese album."}
        </p>
      `, "blue")}

      ${infoCard(`
        <p class="content-copy" style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#495043;">
          Tu balance de puntos sigue activo y tus ofertas pendientes pueden acercarte justo a esa figura dificil que te falta.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6d6553;">
          Si esta semana quieres empujar progreso, entra a tu coleccion, revisa recompensas y checa si ya tienes algo nuevo para intercambiar.
        </p>
      `, "neutral")}

      ${ctaButton("Abrir mi coleccion", `${SITE_URL}/coleccion`, { from: "#315f91", to: "#5b84ca" })}
    `,
  });

  return sendEmail({
    to: opts.to,
    subject: `Tu resumen semanal DOFLINS${opts.pointsBalance > 0 ? ` - ${opts.pointsBalance} puntos` : ""}`,
    html,
  });
}

export async function sendRewardAvailable(opts: {
  to: string;
  rewardName: string;
  pointsCost: number;
  userBalance: number;
}): Promise<boolean> {
  const remainingAfterRedeem = Math.max(0, opts.userBalance - opts.pointsCost);

  const html = emailLayout({
    preheader: "Ya puedes canjear una nueva recompensa en DOFLINS.",
    eyebrow: "Tienda de puntos",
    title: "Ya desbloqueaste una recompensa.",
    intro: `Tu balance ya alcanzo para canjear "${opts.rewardName}". Si te interesa, este es buen momento para tomarla antes de que cambie el catalogo.`,
    accent: {
      from: "#6d2360",
      to: "#d163b6",
      glow: "rgba(255,202,244,0.34)",
    },
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        <tr>
          ${pointsChip("Tu balance", `${formatNumber(opts.userBalance)} pts`, "rose")}
          ${pointsChip("Costo", `${formatNumber(opts.pointsCost)} pts`, "gold")}
        </tr>
      </table>

      ${infoCard(`
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8b4b78;font-weight:800;">
          Recompensa disponible
        </p>
        <p style="margin:0 0 8px;font-size:28px;line-height:1.05;color:#301528;font-weight:900;">
          ${escapeHtml(opts.rewardName)}
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#6a4661;">
          Si la canjeas ahora, todavia te quedarian ${formatNumber(remainingAfterRedeem)} puntos para seguir acumulando hacia tu siguiente objetivo.
        </p>
      `, "rose")}

      ${infoCard(`
        <p class="content-copy" style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#495043;">
          Tus puntos no solo sirven para presumir progreso: tambien te abren acceso a recompensas, cupones y extras del ecosistema DOFLINS.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6d6553;">
          Entra a la tienda de puntos y revisa que otras opciones ya estan cerca de tu alcance.
        </p>
      `, "neutral")}

      ${ctaButton("Ir a recompensas", `${SITE_URL}/recompensas`, { from: "#7f2a72", to: "#d86dbf" })}
    `,
  });

  return sendEmail({ to: opts.to, subject: `Ya puedes canjear "${opts.rewardName}" en DOFLINS`, html });
}
