
import React from 'react';
import { GridIcon, CameraFlipIcon, RecenterIcon } from '../assets/icons';
import { DisplayMode } from '../types';

interface ControlButtonProps {
    buttonRef: (el: HTMLButtonElement | null) => void;
    children: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
    title: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ children, onClick, isActive, title, buttonRef }) => (
    <button
        ref={buttonRef}
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white/90 transition-all duration-200 transform-gpu hover:scale-110 hover:bg-white/20 active:scale-95 active:bg-white/30 ${isActive ? 'bg-white/20' : ''}`}
        title={title}
    >
        {children}
    </button>
);

interface BottomDockProps {
    isGridVisible: boolean;
    onToggleGrid: () => void;
    onToggleCamera: () => void;
    onRecenter: () => void;
    dockRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>;
    isActive: boolean;
    onMouseEnter: () => void;
    displayMode?: DisplayMode;
}

export const BottomDock: React.FC<BottomDockProps> = ({
    isGridVisible,
    onToggleGrid,
    onToggleCamera,
    onRecenter,
    dockRefs,
    isActive,
    onMouseEnter,
    displayMode = 'MR',
}) => {
  const setRef = (id: string) => (el: HTMLButtonElement | null) => {
      if (el) dockRefs.current.set(id, el);
      else dockRefs.current.delete(id);
  };
    
  const modeClasses = {
    AR: 'bg-black/10 backdrop-blur-md border-white/10',
    MR: 'bg-black/20 backdrop-blur-xl border-white/20',
    VR: 'bg-black/30 backdrop-blur-2xl border-white/20',
  };

  return (
    <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-500 ease-in-out"
        style={{ 
          transform: 'translateZ(0px) translateX(-50%)',
          opacity: isActive ? 1 : 0.5,
        }}
        onMouseEnter={onMouseEnter}
    >
        <div className={`rounded-full flex items-center p-2 border gap-2 shadow-2xl ${modeClasses[displayMode]}`}>
            <ControlButton buttonRef={setRef('grid')} onClick={onToggleGrid} isActive={isGridVisible} title="Toggle Apps">
                <GridIcon />
            </ControlButton>
            <div className="w-px h-6 bg-white/20"></div>
            <ControlButton buttonRef={setRef('camera')} onClick={onToggleCamera} title="Flip Camera">
                <CameraFlipIcon />
            </ControlButton>
            <div className="w-px h-6 bg-white/20"></div>
            <ControlButton buttonRef={setRef('recenter')} onClick={onRecenter} title="Recenter View">
                <RecenterIcon />
            </ControlButton>
      </div>
    </div>
  );
};