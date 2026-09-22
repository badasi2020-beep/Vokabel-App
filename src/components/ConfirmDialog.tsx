import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Bestätigen",
  danger,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-forest-light mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-pill bg-cream-deep text-forest font-medium"
        >
          Abbrechen
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-pill text-cream-soft font-medium ${
            danger ? "bg-clay" : "bg-forest"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
