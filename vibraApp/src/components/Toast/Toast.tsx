import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './Toast.css';

export type ToastType = 'success' | 'loading' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // en milisegundos
}

export function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, type, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="toast-icon toast-icon--success" />;
      case 'loading':
        return <FontAwesomeIcon icon={faSpinner} className="toast-icon toast-icon--loading" spin />;
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} className="toast-icon toast-icon--error" />;
    }
  };

  return (
    <div className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''}`}>
      {getIcon()}
      <span className="toast-message">{message}</span>
    </div>
  );
}
