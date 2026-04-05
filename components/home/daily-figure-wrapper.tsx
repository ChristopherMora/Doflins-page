"use client";

import dynamic from "next/dynamic";

const DailyFigure = dynamic(
  () => import("@/components/home/daily-figure").then((m) => m.DailyFigure),
  { ssr: false }
);

export function DailyFigureWrapper() {
  return <DailyFigure />;
}
