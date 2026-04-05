"use client";

import dynamic from "next/dynamic";

const WantListManager = dynamic(
  () => import("@/components/collection/want-list-manager").then((m) => m.WantListManager),
  { ssr: false }
);

interface WantListWrapperProps {
  isOwner?: boolean;
  userId?: string;
}

export function WantListWrapper({ isOwner = true, userId }: WantListWrapperProps) {
  return <WantListManager isOwner={isOwner} userId={userId} />;
}
