'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bgColor = 'var(--cortex-dark-card)';
          let borderColor = 'var(--cortex-border)';
          let textColor = '#ffffff';

          if (toast.type === 'success') {
            borderColor = 'var(--cortex-green-badge-text)';
            bgColor = '#14301a';
            textColor = '#88f5a2';
          } else if (toast.type === 'error') {
            borderColor = 'var(--cortex-red-danger)';
            bgColor = '#381616';
            textColor = '#ff9999';
          }

          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{
                pointerEvents: 'auto',
                padding: '12px 18px',
                borderRadius: '10px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                color: textColor,
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                maxWidth: '380px',
                animation: 'slideUp 0.3s ease-out',
              }}
            >
              <span>{toast.type === 'success' ? '✔' : toast.type === 'error' ? '✖' : 'ℹ'}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}
