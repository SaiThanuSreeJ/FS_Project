import React from 'react'

const LoadingSpinner = ({ size = 'medium', message = 'Loading Vesto...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[240px] w-full p-8 space-y-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size] || sizeClasses.medium} rounded-full border-slate-800 border-t-emerald-500 animate-spin`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>
      {message && (
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
