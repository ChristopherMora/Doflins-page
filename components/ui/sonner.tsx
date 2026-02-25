"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster(): React.JSX.Element {
  return (
    <Sonner
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        duration: 2800,
      }}
    />
  );
}
