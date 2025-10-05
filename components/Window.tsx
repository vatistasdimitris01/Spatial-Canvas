
import React from 'react';

interface WindowProps {
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  children: React.ReactNode;
  closeButtonRef: React.RefObject<HTMLButtonElement>;
  dragHandleRef: React.RefObject<HTMLDivElement>;
  isResizing: boolean;
}

export const Window: React.FC<WindowProps> = ({ title, position, size, onClose, children, closeButtonRef, dragHandleRef, isResizing }) => {
  return (
    <div
      className="absolute top-0 left-0 bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl border flex flex-col overflow-hidden z-30"
      style={{
        transform: `translateX(${position.x}px) translateY(${position.y}px) translateZ(-400px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        transition: 'box-shadow 0.3s ease-in-out, transform 0.1s linear',
        boxShadow: isResizing 
          ? '0 0 0 2px rgba(59, 130, 246, 1), 0 0 40px rgba(59, 130, 246, 0.7)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between p-3 pl-5 text-white/80 border-b border-white/10">
        <span className="font-medium">{title}</span>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close window"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-grow p-1 overflow-y-auto relative">
        {children}
      </div>

      {/* Drag Handle */}
      <div 
        ref={dragHandleRef}
        className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <div className="w-28 h-1.5 bg-white/30 rounded-full transition-colors hover:bg-white/50"></div>
      </div>
    </div>
  );
};
