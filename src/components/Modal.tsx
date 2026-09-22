import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Eigener Dialog statt window.prompt()/confirm() - die machten auf dem iPhone Probleme.
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-forest/40 px-3 pb-3 sm:p-4">
      <div
        className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-card bg-cream-soft shadow-card p-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-forest">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="h-8 w-8 rounded-full bg-cream-deep text-forest flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
