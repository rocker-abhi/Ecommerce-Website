import React from 'react';
import { useToast } from '../context/ToastContext';
import type { Toast } from '../context/ToastContext';

const icons: Record<Toast['type'], React.ReactNode> = {
  success: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { dismissToast } = useToast();
  const duration = toast.duration ?? 4000;

  return (
    <div className={`toast-item toast-${toast.type}`}>
      <div className="toast-body">
        {icons[toast.type]}
        <div className="toast-content">
          <div className="toast-title">{toast.title}</div>
          {toast.message && <div className="toast-message">{toast.message}</div>}
        </div>
        <button className="toast-close" onClick={() => dismissToast(toast.id)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {duration > 0 && (
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
