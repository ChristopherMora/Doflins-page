"use client";

import { motion } from "framer-motion";

export interface RankingRow {
  rank: number;
  supabaseUserId: string;
  displayName: string | null;
  userEmail: string;
  total: number;
}

function displayLabel(row: RankingRow) {
  return row.displayName ?? row.userEmail;
}

export function RankingPodium({ rows }: { rows: RankingRow[] }) {
  // rows comes as [2°, 1°, 3°] for olympic podium order
  return (
    <div className="mb-8 flex items-end justify-center gap-3">
      {rows.map((row, i) => {
        const pos = row.rank;
        const isFirst = pos === 1;
        const isSecond = pos === 2;

        const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉";
        const heightClass = isFirst ? "pb-6 pt-5" : isSecond ? "pb-4 pt-4" : "pb-3 pt-3";
        const bgClass = isFirst
          ? "bg-gradient-to-b from-[#fff9e6] to-[#fef0a0] border-[#f0c020]"
          : isSecond
            ? "bg-gradient-to-b from-[#f4f8fc] to-[#dde8f0] border-[#aabecb]"
            : "bg-gradient-to-b from-[#fdf4ef] to-[#f0ddd0] border-[#c8977a]";
        const widthClass = isFirst ? "w-[38%]" : "w-[28%]";

        return (
          <motion.div
            key={row.supabaseUserId}
            initial={{ opacity: 0, y: 40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
              delay: i * 0.12,
            }}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 text-center shadow-sm ${bgClass} ${heightClass} ${widthClass} px-2`}
          >
            <motion.span
              className="text-2xl"
              animate={isFirst ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              {medal}
            </motion.span>
            <p className="mt-0.5 w-full truncate text-xs font-bold text-[var(--ink-800)]">
              {displayLabel(row)}
            </p>
            <p className="font-title text-2xl font-black text-[#4e6f2a]">{row.total}</p>
            <p className="text-[10px] text-[var(--ink-400)]">figuras</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--surface-200)] bg-[var(--background)]">
      {rows.map((row, i) => (
        <motion.div
          key={row.supabaseUserId}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.28, delay: Math.min(i, 14) * 0.04, ease: "easeOut" }}
          className={`flex items-center gap-3 px-4 py-3 ${
            i % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--surface-50)]"
          } ${i < rows.length - 1 ? "border-b border-[var(--surface-100)]" : ""}`}
        >
          <span className="w-6 shrink-0 text-center text-xs font-bold text-[var(--ink-300)]">
            {row.rank}
          </span>
          <span className="flex-1 truncate text-sm font-medium text-[var(--ink-800)]">
            {displayLabel(row)}
          </span>
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="font-title font-black text-[#4e6f2a]">{row.total}</span>
            <span className="text-xs text-[var(--ink-400)]">figs</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
