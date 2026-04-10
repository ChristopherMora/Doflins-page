"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  QrCodeIcon,
  SparklesIcon,
  StarIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  { href: "/admin/doflins", label: "Alta figuras", icon: SparklesIcon },
  { href: "/admin/bolsas", label: "Bolsas / QR", icon: QrCodeIcon },
  { href: "/admin/codigos", label: "Códigos", icon: TicketIcon },
  { href: "/admin/rewards", label: "Recompensas", icon: StarIcon },
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartBarIcon },
  { href: "/admin/analytics", label: "Analytics", icon: PresentationChartLineIcon },
] as const;

export function AdminNav(): React.JSX.Element | null {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[#30491f] bg-[linear-gradient(180deg,#16220d_0%,#203313_100%)] shadow-[0_14px_34px_rgba(14,22,8,0.22)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-8">
        <span className="inline-flex shrink-0 select-none items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-2 text-sm font-extrabold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span aria-hidden="true" className="text-base leading-none">⚙️</span>
          Admin
        </span>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto py-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? "border-[#dff2aa] bg-[#f1ffd1] text-[#20310f] shadow-[0_8px_24px_rgba(197,227,121,0.22)]"
                    : "border-[#31471f] bg-[#243716] text-[#eef6d6] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[#4f6b31] hover:bg-[#2d431c] hover:text-[#ffffff]"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#537526]" : "text-[#dce8b4]"}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
