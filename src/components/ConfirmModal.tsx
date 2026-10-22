import React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel
}) => {
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button to prevent accidental destructive action
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        <h3 id="confirm-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            id="confirm-modal-cancel-btn"
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={variant === 'danger' ? { background: '#dc2626', borderColor: '#b91c1c' } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
