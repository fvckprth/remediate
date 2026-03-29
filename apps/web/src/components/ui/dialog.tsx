"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { ComponentProps, ReactNode } from "react";

export function Dialog({ children, ...props }: ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root {...props}>{children}</BaseDialog.Root>;
}

export function DialogTrigger({ children, ...props }: ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger render={children as React.ReactElement<Record<string, unknown>>} {...props} />;
}

export function DialogContent({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
      <BaseDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6">
        <BaseDialog.Title className="text-lg font-bold mb-4">
          {title}
        </BaseDialog.Title>
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogClose({ children, ...props }: ComponentProps<typeof BaseDialog.Close>) {
  return children
    ? <BaseDialog.Close render={children as React.ReactElement<Record<string, unknown>>} {...props} />
    : <BaseDialog.Close {...props} />;
}
