"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';

interface ToastProps {
  variant?: 'default' | 'destructive';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([]);
  const [counter, setCounter] = useState(0);

  const toast = (props: ToastProps) => {
    const id = counter;
    setCounter(prev => prev + 1);
    
    setToasts(prev => [...prev, { ...props, id }]);
    
    // Auto dismiss
    const duration = props.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };
  
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`p-4 rounded-md shadow-md min-w-[300px] max-w-[400px] animate-fadeIn
              ${t.variant === 'destructive' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-green-100 border-l-4 border-green-500'}`}
          >
            <div className="flex justify-between items-start">
              <h3 className={`font-medium ${t.variant === 'destructive' ? 'text-red-800' : 'text-green-800'}`}>{t.title}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              >
                ×
              </button>
            </div>
            {t.description && <p className="mt-1 text-sm text-gray-600">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 