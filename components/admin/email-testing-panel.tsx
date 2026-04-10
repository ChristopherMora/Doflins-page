"use client";

import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmailTemplate = "purchase" | "trade" | "weekly" | "reward";

type FeedbackState =
  | { type: "ok"; text: string }
  | { type: "error"; text: string }
  | null;

const TEMPLATE_CONFIG: Array<{
  id: EmailTemplate;
  title: string;
  description: string;
  Icon: React.ElementType;
  accentClassName: string;
}> = [
  {
    id: "purchase",
    title: "Confirmacion de compra",
    description: "Prueba el correo que sale despues de una compra pagada en Shopify.",
    Icon: ShoppingBagIcon,
    accentClassName: "bg-[#e8faf0] text-[#1a7a4a]",
  },
  {
    id: "trade",
    title: "Oferta de intercambio",
    description: "Simula la notificacion que recibe el dueno de un listado cuando le hacen una oferta.",
    Icon: ArrowsRightLeftIcon,
    accentClassName: "bg-[#fff4e8] text-[#b46a2d]",
  },
  {
    id: "weekly",
    title: "Resumen semanal",
    description: "Manda un digest de ejemplo con progreso, puntos, ofertas y mejor rareza.",
    Icon: ChartBarIcon,
    accentClassName: "bg-[#e8f0fe] text-[#3b5bdb]",
  },
  {
    id: "reward",
    title: "Recompensa disponible",
    description: "Prueba el aviso para cuando un usuario ya puede canjear una recompensa.",
    Icon: GiftIcon,
    accentClassName: "bg-[#fde8f5] text-[#9b1fae]",
  },
];

export function EmailTestingPanel(): React.JSX.Element {
  const [recipient, setRecipient] = useState("");
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/admin-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { userEmail?: string | null }) => {
        if (!cancelled && data.userEmail) {
          setRecipient((current) => current || data.userEmail || "");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const sendTemplate = async (template: EmailTemplate) => {
    const to = recipient.trim();
    if (!to) {
      setFeedback({ type: "error", text: "Primero escribe el correo al que quieres mandar la prueba." });
      return;
    }

    setSendingTemplate(template);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/emails/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to, template }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message ?? `Error ${response.status}`);
      }

      setFeedback({
        type: "ok",
        text: body.message ?? `Correo de prueba enviado a ${to}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo enviar el correo de prueba.",
      });
    } finally {
      setSendingTemplate(null);
    }
  };

  return (
    <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1">
          <h2 className="font-title text-xl text-[var(--ink-900)]">Pruebas de correo</h2>
          <p className="text-sm text-[var(--ink-600)]">
            Envia plantillas de ejemplo desde el panel admin sin tener que disparar compras, trades o cron reales.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--ink-800)]" htmlFor="email-test-recipient">
            Destinatario de prueba
          </label>
          <Input
            id="email-test-recipient"
            type="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="tu-correo@dominio.com"
          />
          <p className="text-xs text-[var(--ink-500)]">
            Usa un correo tuyo para confirmar que el remitente, layout y links salgan bien.
          </p>
        </div>

        {feedback ? (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === "ok"
                ? "border-[#c8e0a0] bg-[#eef5df] text-[#2f5b1f]"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "ok" ? (
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {TEMPLATE_CONFIG.map(({ id, title, description, Icon, accentClassName }) => {
            const isSending = sendingTemplate === id;

            return (
              <div
                key={id}
                className="rounded-2xl border border-[#d8d2b4] bg-white/70 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start gap-3">
                  <span className={`rounded-2xl p-3 ${accentClassName}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--ink-900)]">{title}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-600)]">{description}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={id === "purchase" ? "primary" : "secondary"}
                  size="sm"
                  disabled={Boolean(sendingTemplate)}
                  onClick={() => void sendTemplate(id)}
                >
                  {isSending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  {isSending ? "Enviando..." : "Enviar prueba"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
