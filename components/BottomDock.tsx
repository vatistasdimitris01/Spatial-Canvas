
import React from 'react';
import { GridIcon, CameraFlipIcon, ZoomIcon, RecenterIcon } from '../assets/icons';

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
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white/90 transition-all duration-200 transform-gpu hover:scale-110 hover:bg-white/20 active:scale-95 ${isActive ? 'bg-white/20' : ''}`}
        title={title}
    >
        {children}
    </button>
);

interface BottomDockProps {
    isGridVisible: boolean;
    onToggleGrid: () => void;
    onToggleCamera: () => void;
    zoomLevel: number;
    onToggleZoom: () => void;
    onRecenter: () => void;
    dockRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>;
    isCollapsed: boolean;
    onExpand: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
    isGridVisible,
    onToggleGrid,
    onToggleCamera,
    zoomLevel,
    onToggleZoom,
    onRecenter,
    dockRefs,
    isCollapsed,
    onExpand,
}) => {
  const setRef = (id: string) => (el: HTMLButtonElement | null) => {
      if (el) dockRefs.current.set(id, el);
      else dockRefs.current.delete(id);
  };
    
  return (
    <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out"
        style={{ transform: 'translateZ(0px) translateX(-50%)' }}
        onMouseEnter={onExpand}
    >
        <div className={`bg-black/40 backdrop-blur-xl rounded-full flex items-center p-2 border border-white/20 gap-2 shadow-2xl transition-all duration-300 ease-out ${isCollapsed ? 'w-16' : 'w-auto'}`}>
            <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 h-12' : 'opacity-100 flex gap-2'}`}>
                <ControlButton buttonRef={setRef('grid')} onClick={onToggleGrid} isActive={isGridVisible} title="Toggle Apps">
                    <GridIcon />
                </ControlButton>
                <ControlButton buttonRef={setRef('camera')} onClick={onToggleCamera} title="Flip Camera">
                    <CameraFlipIcon />
                </ControlButton>
                <ControlButton buttonRef={setRef('zoom')} onClick={onToggleZoom} title="Toggle Zoom">
                    <ZoomIcon zoomLevel={zoomLevel} />
                </ControlButton>
                <ControlButton buttonRef={setRef('recenter')} onClick={onRecenter} title="Recenter View">
                    <RecenterIcon />
                </ControlButton>
            </div>
             <button
                onClick={onExpand}
                className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center text-white/90 transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                title="Show Controls"
            >
                <div className="w-8 h-1.5 bg-white/50 rounded-full"></div>
            </button>
      </div>
    </div>
  );
};
