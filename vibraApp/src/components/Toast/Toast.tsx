import { useEffect } from 'react';
import { Icons } from '../Icons';

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
        return <Icons.CheckCircle className="toast-icon toast-icon--success" />;
      case 'loading':
        return <Icons.Spinner className="toast-icon toast-icon--loading" spin />;
      case 'error':
        return <Icons.TimesCircle className="toast-icon toast-icon--error" />;
    }
  };

  return (
    <div className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''}`}>
      {getIcon()}
      <span className="toast-message">{message}</span>
    </div>
  );
}
