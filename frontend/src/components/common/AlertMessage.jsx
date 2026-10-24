import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const TOAST_CONFIG = {
  success: {
    icon: '✓',
    bg: '#e9f3ed',
    color: '#1b4332',
    borderColor: '#1b4332'
  },
  danger: {
    icon: '✕',
    bg: '#fde8e8',
    color: '#991b1b',
    borderColor: '#dc2626'
  },
  error: {
    icon: '✕',
    bg: '#fde8e8',
    color: '#991b1b',
    borderColor: '#dc2626'
  },
  warning: {
    icon: '⚠️',
    bg: '#fef3c7',
    color: '#92400e',
    borderColor: '#d97706'
  },
  info: {
    icon: 'ℹ️',
    bg: '#e0f2fe',
    color: '#075985',
    borderColor: '#0284c7'
  }
};

/**
 * Compact floating toast notification component for success and alert notices
 * Automatically dismisses after `duration` ms (default: 4000)
 */
const AlertMessage = ({
  type = 'danger',
  message,
  onClose,
  duration = 4000,
  inline = false
}) => {
  useEffect(() => {
    if (!message || !onClose || !duration || duration <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const normalizedType = type === 'error' ? 'danger' : type;
  const config = TOAST_CONFIG[normalizedType] || TOAST_CONFIG.danger;

  const toastItem = (
    <div
      className="toast-item shadow-sm bg-white d-flex align-items-center justify-content-between"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        pointerEvents: 'auto',
        borderRadius: '10px',
        border: '1px solid #e7e5e4',
        borderLeft: `3.5px solid ${config.borderColor}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: '8px 12px',
        minWidth: '240px',
        maxWidth: '360px'
      }}
    >
      <div className="d-flex align-items-center gap-2 me-2">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
          style={{
            width: '22px',
            height: '22px',
            backgroundColor: config.bg,
            color: config.color,
            fontSize: '0.7rem'
          }}
        >
          {config.icon}
        </span>
        <span
          className="text-dark small"
          style={{ fontSize: '0.825rem', lineHeight: 1.35 }}
        >
          {message}
        </span>
      </div>

      {onClose && (
        <button
          type="button"
          className="btn-close ms-2 flex-shrink-0"
          style={{ fontSize: '0.6rem' }}
          aria-label="Close"
          onClick={onClose}
        />
      )}
    </div>
  );

  if (inline) {
    return toastItem;
  }

  const toastContainer =
    typeof document !== 'undefined' ? document.getElementById('toast-root') : null;

  if (toastContainer) {
    return createPortal(toastItem, toastContainer);
  }

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1099, pointerEvents: 'none' }}
    >
      {toastItem}
    </div>
  );
};

export default AlertMessage;
