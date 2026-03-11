"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GiftIcon, XMarkIcon } from "@heroicons/react/24/solid";

const REF_CODE_KEY = "doflins_ref_code_v1";
const REF_SHOWN_KEY = "doflins_ref_shown_v1";
const REF_CODE_REGEX = /^[A-Z0-9_-]{3,32}$/i;

function ReferralBannerInner(): React.JSX.Element | null {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("ref");
    if (fromUrl && REF_CODE_REGEX.test(fromUrl)) {
      const clean = fromUrl.toUpperCase();
      localStorage.setItem(REF_CODE_KEY, clean);
      localStorage.removeItem(REF_SHOWN_KEY);
      setCode(clean);
      return;
    }
    const stored = localStorage.getItem(REF_CODE_KEY);
    const shown = localStorage.getItem(REF_SHOWN_KEY);
    if (stored && !shown) {
      setCode(stored);
    }
  }, [searchParams]);

  const dismiss = () => {
    setCode(null);
    localStorage.setItem(REF_SHOWN_KEY, "1");
  };

  const copy = () => {
    if (!code) return;
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!code) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 sm:bottom-6">
      <div className="animate-catalog-fadein flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[#c5dca0] bg-[#eef5df] p-3 shadow-[0_8px_28px_rgba(78,111,42,0.22)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4e6f2a]">
          <GiftIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[#2d4915]">¡10% de descuento para ti! 🎉</p>
          <p className="text-xs text-[#4a6a28]">Un amigo te envió este código. Úsalo en el checkout:</p>
          <button
            onClick={copy}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 font-mono text-sm font-black text-[#4e6f2a] ring-1 ring-[#b8d493] transition hover:bg-[#f5fae8] active:scale-95"
          >
            {code}
            <span className="text-xs">{copied ? "✓ copiado" : "📋 copiar"}</span>
          </button>
        </div>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6a8a48] transition hover:bg-[#ddf0c0]"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ReferralBanner(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <ReferralBannerInner />
    </Suspense>
  );
}
