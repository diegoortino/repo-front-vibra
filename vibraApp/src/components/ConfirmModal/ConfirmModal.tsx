import { Icons } from '../Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <Icons.ExclamationTriangle />
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button className="confirm-button confirm-button--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="confirm-button confirm-button--confirm" onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
