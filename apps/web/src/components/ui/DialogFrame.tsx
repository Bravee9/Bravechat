"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native modal shell: browser supplies focus trapping, Escape and background inertness. */
export function DialogFrame({ title, description, onClose, children }: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `dialog-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? `${titleId}-description` : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md border border-ocean-dark-border bg-[#061829] p-0 text-ocean-light shadow-2xl backdrop:bg-black/70"
      data-testid="workflow-dialog"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        {description ? <p id={`${titleId}-description`} className="mt-2 text-sm leading-6 text-ocean-light/65">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
