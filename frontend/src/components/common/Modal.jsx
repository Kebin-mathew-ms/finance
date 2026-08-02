import React from 'react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  confirmVariant = "primary",
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg focus:outline-none transition duration-150"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="text-sm text-zinc-300 mb-6 leading-relaxed">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
