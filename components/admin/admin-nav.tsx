"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  QrCodeIcon,
  SparklesIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";

const NAV_ITEMS = [
  { href: "/admin/doflins", label: "Alta figuras", icon: SparklesIcon },
  { href: "/admin/bolsas", label: "Bolsas / QR", icon: QrCodeIcon },
  { href: "/admin/codigos", label: "Códigos", icon: TicketIcon },
  { href: "/admin/dashboard", label: "Dashboard", icon: ChartBarIcon },
] as const;

export function AdminNav(): React.JSX.Element | null {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[#1a2a0e] bg-[#1e2e12]/96 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center px-4 sm:px-8">
        {/* Logo */}
        <span className="mr-3 shrink-0 select-none py-3 text-sm font-bold text-white/70">
          ⚙️ Admin
        </span>

        {/* Nav links */}
        <div className="flex flex-1 items-center overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "border-[#9acd42] text-[#c8f070]"
                    : "border-transparent text-[#b8d890] hover:border-[#6a9a30] hover:text-[#d8f0a0]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
