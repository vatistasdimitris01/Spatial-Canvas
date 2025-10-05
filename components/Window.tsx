
import React from 'react';
import { DisplayMode } from '../types';

interface WindowProps {
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  children: React.ReactNode;
  windowRef: React.RefObject<HTMLDivElement>;
  closeButtonRef: React.RefObject<HTMLButtonElement>;
  dragHandleRef: React.RefObject<HTMLDivElement>;
  isResizing: boolean;
  isHovered: boolean;
  displayMode?: DisplayMode;
}

export const Window: React.FC<WindowProps> = ({ title, position, size, onClose, children, windowRef, closeButtonRef, dragHandleRef, isResizing, isHovered, displayMode = 'MR' }) => {
  const modeClasses = {
    AR: 'bg-black/10 backdrop-blur-lg border-white/10',
    MR: 'bg-black/20 backdrop-blur-2xl border-white/20', // Vision Pro like
    VR: 'bg-black/40 backdrop-blur-3xl border-white/20',
  };
  
  return (
    <div
      ref={windowRef}
      className={`group absolute top-0 left-0 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-30 transition-all duration-300 ease-out ${modeClasses[displayMode]}`}
      style={{
        transform: `translateX(${position.x}px) translateY(${position.y}px) translateZ(-400px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        boxShadow: isResizing 
          ? '0 0 0 2px rgba(59, 130, 246, 1), 0 0 60px rgba(59, 130, 246, 0.5)' 
          : '0 40px 80px -20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Content */}
      <div className="flex-grow pt-8 p-1 overflow-y-auto relative">
        {children}
      </div>

      {/* Close Button (visible on hover) */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className={`absolute top-3 left-3 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 active:bg-black/60 active:scale-90 flex items-center justify-center transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        aria-label={`Close ${title} window`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Drag Handle */}
      <div 
        ref={dragHandleRef}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <div className="w-32 h-1.5 bg-white/40 rounded-full transition-colors hover:bg-white/60"></div>
      </div>
    </div>
  );
};