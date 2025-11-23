import { Icons } from '../Icons';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function AlertModal({ isOpen, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-icon">
          <Icons.ExclamationCircle />
        </div>
        <p className="alert-message">{message}</p>
        <div className="alert-buttons">
          <button className="alert-button" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
