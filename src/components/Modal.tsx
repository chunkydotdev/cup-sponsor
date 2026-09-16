"use client";

import { useEffect } from "react";

/** A panel over the stage. Escape and the backdrop both close it. */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:justify-end sm:p-6">
      {/* Deliberately not a blur: the whole point is watching the logo land on
          the cup while you fill this in. */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/45 sm:bg-gradient-to-l sm:from-black/80 sm:via-black/35 sm:to-transparent"
      />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto sm:max-w-sm">{children}</div>
    </div>
  );
}
