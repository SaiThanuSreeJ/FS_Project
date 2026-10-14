import React, { createContext, useContext, useState, useCallback } from 'react'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let borderColor = 'border-blue-500'
          let bgColor = 'bg-slate-900'
          let Icon = FiInfo
          let iconColor = 'text-blue-400'

          if (toast.type === 'success') {
            borderColor = 'border-emerald-500'
            Icon = FiCheckCircle
            iconColor = 'text-emerald-400'
          } else if (toast.type === 'error') {
            borderColor = 'border-red-500'
            Icon = FiAlertCircle
            iconColor = 'text-red-400'
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border-l-4 ${borderColor} ${bgColor} border-t border-r border-b border-slate-800 text-slate-100 animate-slide-in backdrop-blur-md transition-all`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 text-lg flex-shrink-0 ${iconColor}`} />
                <p className="text-sm font-medium text-slate-200 leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-100 ml-3 p-1 rounded-lg transition-colors focus:outline-none"
                aria-label="Dismiss toast"
              >
                <FiX className="text-base" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default ToastContext
