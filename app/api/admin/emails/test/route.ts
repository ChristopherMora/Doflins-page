import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth-admin";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  sendPurchaseConfirmation,
  sendRewardAvailable,
  sendTradeOfferNotification,
  sendWeeklyDigest,
} from "@/lib/server/emails";
import { getClientIp } from "@/lib/server/request";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  to: z.email("Correo inválido."),
  template: z.enum(["purchase", "trade", "weekly", "reward"]),
});

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get("x-admin-token")?.trim() ?? "";
  const requiredToken = process.env.ADMIN_FORM_TOKEN?.trim();

  if (requiredToken && token && token === requiredToken) {
    return true;
  }

  try {
    const supabase = createSupabaseServerClientForRoute(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return isAdminEmail(user?.email);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_email_test:${ip}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        status: "error",
        message: "Demasiados intentos. Espera un momento.",
      },
      { status: 429 },
    );
  }

  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json(
      {
        status: "error",
        message: "No autorizado.",
      },
      { status: 401 },
    );
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json(
      {
        status: "error",
        message: "Falta RESEND_API_KEY en las variables de entorno.",
      },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof z.ZodError
            ? error.issues[0]?.message ?? "Payload inválido."
            : "Payload inválido.",
      },
      { status: 400 },
    );
  }

  let sent = false;

  switch (payload.template) {
    case "purchase":
      sent = await sendPurchaseConfirmation({
        to: payload.to,
        orderTotal: "349.00",
        pointsAwarded: 35,
        referralBonus: 25,
      });
      break;
    case "trade":
      sent = await sendTradeOfferNotification({
        to: payload.to,
        offererName: "Coleccionista DOFLINS",
        offeredFigureName: "Jaguar Prisma",
        yourFigureName: "Tigre Galactico",
        listingId: 123,
      });
      break;
    case "weekly":
      sent = await sendWeeklyDigest({
        to: payload.to,
        displayName: "Collector Test",
        pointsBalance: 480,
        collectionCount: 18,
        totalFigures: 60,
        newTradeOffers: 2,
        topRarity: "Legendaria",
      });
      break;
    case "reward":
      sent = await sendRewardAvailable({
        to: payload.to,
        rewardName: "Cupon 15% OFF",
        pointsCost: 300,
        userBalance: 420,
      });
      break;
  }

  if (!sent) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "No se pudo enviar el correo. Revisa RESEND_API_KEY, EMAIL_FROM y la verificacion del dominio.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    status: "ok",
    message: `Correo de prueba enviado a ${payload.to}.`,
    template: payload.template,
  });
}
