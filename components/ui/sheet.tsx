"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XMarkIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>): React.JSX.Element {
  return <DialogPrimitive.Root {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>): React.JSX.Element {
  return <DialogPrimitive.Trigger {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>): React.JSX.Element {
  return <DialogPrimitive.Close {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>): React.JSX.Element {
  return <DialogPrimitive.Portal {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>): React.JSX.Element {
  return <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm", className)} {...props} />;
}

const sheetVariants = cva(
  "fixed z-50 bg-white p-6 shadow-2xl transition-transform duration-300 ease-out border-black/10 border",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

function SheetContent({ side = "right", className, children, ...props }: SheetContentProps): React.JSX.Element {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--ink-600)] transition hover:bg-[var(--surface-200)]">
          <XMarkIcon className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("mb-4 flex flex-col gap-1.5", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>): React.JSX.Element {
  return <DialogPrimitive.Title className={cn("font-title text-2xl font-bold text-[var(--ink-900)]", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>): React.JSX.Element {
  return <DialogPrimitive.Description className={cn("text-sm text-[var(--ink-700)]", className)} {...props} />;
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
