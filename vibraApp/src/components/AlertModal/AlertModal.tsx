import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './AlertModal.css';

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
          <FontAwesomeIcon icon={faExclamationCircle} />
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
