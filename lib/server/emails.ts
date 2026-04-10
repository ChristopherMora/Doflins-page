import { Resend } from "resend";

// ─── Config ─────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "DOFLINS <noreply@doflins.dofer.mx>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(RESEND_API_KEY);
  }
  return resendInstance;
}

// ─── Core sender ────────────────────────────────────────────────────────────────

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
      throw new Error(error.message || "Resend rechazó el envío.");
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    if (err instanceof Error && err.message.trim()) {
      throw err;
    }
    throw new Error("Falló el envío del correo.");
  }
}

// ─── Layout wrapper ─────────────────────────────────────────────────────────────

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4e6f2a,#6b8f3c);padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">DOFLINS</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9f8f4;text-align:center;border-top:1px solid #e8e6dc;">
              <p style="margin:0;font-size:12px;color:#8a8677;">
                <a href="${SITE_URL}" style="color:#4e6f2a;text-decoration:none;font-weight:600;">doflins.dofer.mx</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#b0a99a;">
                Puedes cambiar tus preferencias de email en
                <a href="${SITE_URL}/notificaciones" style="color:#4e6f2a;">tu perfil</a>.
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

function ctaButton(text: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#4e6f2a,#6b8f3c);color:#fff;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── Email: Purchase Confirmation ───────────────────────────────────────────────

export async function sendPurchaseConfirmation(opts: {
  to: string;
  orderTotal: string;
  pointsAwarded: number;
  referralBonus?: number;
}): Promise<boolean> {
  const pointsText = opts.pointsAwarded > 0
    ? `<tr>
        <td style="padding:12px 16px;background:#f0fdf4;border-radius:10px;">
          <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">
            🎉 +${opts.pointsAwarded} puntos DOFLINS añadidos a tu cuenta
          </p>
          ${opts.referralBonus ? `<p style="margin:4px 0 0;font-size:13px;color:#15803d;">+ ${opts.referralBonus} puntos bonus por código referido</p>` : ""}
        </td>
      </tr>`
    : "";

  const html = emailLayout("¡Gracias por tu compra!", `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">¡Gracias por tu compra! 🎊</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Tu pedido por <strong>$${opts.orderTotal} MXN</strong> ha sido confirmado.
      Pronto recibirás tus figuras DOFLINS.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${pointsText}
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#666;line-height:1.5;">
      Cuando recibas tu pack, escanea el código de tu bolsa en nuestra página para
      revelar qué figuras te tocaron y agregarlas a tu colección.
    </p>
    ${ctaButton("Ir a revelar mis figuras", `${SITE_URL}/reveal`)}
    <p style="margin:0;font-size:13px;color:#999;text-align:center;">
      ¿Dudas con tu pedido? <a href="${SITE_URL}/faq" style="color:#4e6f2a;">Consulta nuestras FAQ</a>
    </p>
  `);

  return sendEmail({ to: opts.to, subject: "🎊 ¡Gracias por tu compra en DOFLINS!", html });
}

// ─── Email: Trade Offer Received ────────────────────────────────────────────────

export async function sendTradeOfferNotification(opts: {
  to: string;
  offererName: string;
  offeredFigureName: string;
  yourFigureName: string;
  listingId: number;
}): Promise<boolean> {
  const html = emailLayout("Nueva oferta de intercambio", `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">¡Tienes una nueva oferta! 🔄</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      <strong>${opts.offererName}</strong> quiere intercambiar contigo.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9f8f4;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:48%;text-align:center;padding:8px;">
                <p style="margin:0 0 4px;font-size:11px;color:#8a8677;text-transform:uppercase;letter-spacing:0.5px;">Te ofrecen</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a1a;">${opts.offeredFigureName}</p>
              </td>
              <td style="width:4%;text-align:center;font-size:20px;color:#b0a99a;">⇄</td>
              <td style="width:48%;text-align:center;padding:8px;">
                <p style="margin:0 0 4px;font-size:11px;color:#8a8677;text-transform:uppercase;letter-spacing:0.5px;">Por tu</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a1a;">${opts.yourFigureName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${ctaButton("Ver oferta", `${SITE_URL}/intercambios`)}
  `);

  return sendEmail({ to: opts.to, subject: `🔄 ${opts.offererName} quiere intercambiar contigo`, html });
}

// ─── Email: Weekly Digest ───────────────────────────────────────────────────────

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

  const statsRows = [
    { emoji: "🏆", label: "Tu colección", value: `${opts.collectionCount}/${opts.totalFigures} (${completionPct}%)` },
    { emoji: "💰", label: "Puntos disponibles", value: String(opts.pointsBalance) },
    ...(opts.newTradeOffers > 0
      ? [{ emoji: "🔄", label: "Ofertas nuevas", value: `${opts.newTradeOffers} pendientes` }]
      : []),
    ...(opts.topRarity
      ? [{ emoji: "✨", label: "Mejor rareza", value: opts.topRarity }]
      : []),
  ];

  const statsHtml = statsRows
    .map(
      (r) =>
        `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #f0efe9;">
            <span style="font-size:16px;">${r.emoji}</span>
            <span style="margin-left:8px;font-size:14px;color:#555;">${r.label}</span>
          </td>
          <td style="padding:10px 16px;border-bottom:1px solid #f0efe9;text-align:right;">
            <span style="font-size:14px;font-weight:700;color:#1a1a1a;">${r.value}</span>
          </td>
        </tr>`,
    )
    .join("");

  const html = emailLayout("Tu resumen semanal DOFLINS", `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">
      ¡Hola${opts.displayName ? `, ${opts.displayName}` : ""}! 👋
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Aquí está tu resumen de la semana en DOFLINS.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f4;border-radius:12px;overflow:hidden;margin:0 0 20px;">
      ${statsHtml}
    </table>
    ${completionPct < 100 ? `
    <p style="margin:0 0 8px;font-size:14px;color:#666;line-height:1.5;">
      🎯 Te faltan <strong>${opts.totalFigures - opts.collectionCount}</strong> figuras para completar tu colección.
      ¡Sigue coleccionando!
    </p>` : `
    <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">
      🏅 ¡Felicidades! Tienes la colección completa. Eres un verdadero coleccionista DOFLINS.
    </p>`}
    ${ctaButton("Ver mi colección", `${SITE_URL}/coleccion`)}
  `);

  return sendEmail({ to: opts.to, subject: `📊 Tu resumen semanal DOFLINS${opts.pointsBalance > 0 ? ` — ${opts.pointsBalance} puntos` : ""}`, html });
}

// ─── Email: Reward Available ────────────────────────────────────────────────────

export async function sendRewardAvailable(opts: {
  to: string;
  rewardName: string;
  pointsCost: number;
  userBalance: number;
}): Promise<boolean> {
  const html = emailLayout("¡Puedes canjear una recompensa!", `
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">¡Nueva recompensa disponible! 🎁</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Tienes <strong>${opts.userBalance} puntos</strong> y ya puedes canjear:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td style="padding:20px;background:linear-gradient(135deg,#fef3c7,#fff7ed);border-radius:12px;text-align:center;">
          <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#1a1a1a;">${opts.rewardName}</p>
          <p style="margin:0;font-size:14px;color:#92400e;">${opts.pointsCost} puntos</p>
        </td>
      </tr>
    </table>
    ${ctaButton("Canjear recompensa", `${SITE_URL}/recompensas`)}
  `);

  return sendEmail({ to: opts.to, subject: `🎁 ¡Ya puedes canjear "${opts.rewardName}"!`, html });
}
