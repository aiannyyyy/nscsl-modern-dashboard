import React, { useState } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  badge?: number;
}

export function FloatingActionButton({ onClick, badge = 0 }: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 left-6 z-[9999] group" // 🔧 FIXED: Added z-[9999]
      style={{
        animation: 'fabBounce 0.5s ease-out',
      }}
    >
      {/* Main Button */}
      <div className={`
        relative bg-gradient-to-r from-blue-600 to-indigo-600 
        rounded-2xl shadow-2xl hover:shadow-blue-500/50
        transition-all duration-300 ease-out
        ${isHovered ? 'pr-6 pl-5 py-4' : 'w-16 h-16'}
        flex items-center justify-center gap-3
      `}>
        {/* Icon */}
        <div className="relative">
          <svg 
            className={`text-white transition-transform duration-300 ${
              isHovered ? 'w-5 h-5 rotate-90' : 'w-7 h-7'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          
          {/* Badge */}
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>

        {/* Text (shows on hover) */}
        <span className={`
          text-white font-semibold text-sm whitespace-nowrap
          transition-all duration-300
          ${isHovered ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden'}
        `}>
          New Job Order
        </span>
      </div>

      {/* Ripple Effect */}
      <div className={`
        absolute inset-0 rounded-2xl bg-blue-400 -z-10
        transition-all duration-300
        ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-0'}
      `} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fabBounce {
          0% {
            opacity: 0;
            transform: translateY(100px) scale(0.5);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}} />
    </button>
  );
}