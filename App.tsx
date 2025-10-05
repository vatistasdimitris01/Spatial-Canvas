
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandTracking, HandData } from './hooks/useHandTracking';
import { useCamera } from './hooks/useCamera';
import { useHeadTracking } from './hooks/useHeadTracking';
import { HandRenderer } from './components/HandCursor';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppGrid } from './components/AppGrid';
import { Window } from './components/Window';
import { BottomDock } from './components/BottomDock';
import { ActiveWindow, Photo } from './types';
import { getApps } from './apps';

const DOCK_HIDE_TIMEOUT = 4000; // 4 seconds

const isCursorOverElement = (hand: HandData, element: HTMLElement | null): boolean => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const cursorX = (1 - hand.cursorPosition.x) * window.innerWidth;
  const cursorY = hand.cursorPosition.y * window.innerHeight;
  return cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom;
};

const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pinchStartRef = useRef<{ [key: number]: string | null }>({});
  const resizeStartRef = useRef<{ distance: number; width: number; height: number} | null>(null);
  const appRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const dockRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const windowDragHandleRef = useRef<HTMLDivElement>(null);
  const windowCloseButtonRef = useRef<HTMLButtonElement>(null);
  const dockHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hands, setHands] = useState<HandData[]>([]);
  const [activeWindow, setActiveWindow] = useState<ActiveWindow | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [isAppGridVisible, setIsAppGridVisible] = useState(true);
  const [isVrMode, setIsVrMode] = useState(true); // VR mode is now default
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  
  const [photos, setPhotos] = useState<Photo[]>([]);

  const { videoStream, cameraError, facingMode, toggleFacingMode, zoom, toggleZoom } = useCamera();
  const { worldTransform, recenter } = useHeadTracking();

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPhotos(prev => [...prev, { id: `photo_${Date.now()}`, src: dataUrl }]);
    // Briefly show feedback? Maybe open photos app? For now, just add it.
  }, [videoRef, facingMode]);
  
  const apps = getApps({ 
    closeWindow: () => setActiveWindow(null),
    photos,
    takePhoto,
    toggleVrMode: () => setIsVrMode(v => !v),
    recenterView: recenter,
    isVrMode,
  });

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const resetDockTimer = useCallback(() => {
    if (dockHideTimer.current) {
        clearTimeout(dockHideTimer.current);
    }
    setIsDockCollapsed(false);
    dockHideTimer.current = setTimeout(() => {
        setIsDockCollapsed(true);
    }, DOCK_HIDE_TIMEOUT);
  }, []);

  const handleHandData = useCallback((handData: HandData[]) => {
    setHands(handData);
    if(handData.length > 0) {
        resetDockTimer();
    }
  }, [resetDockTimer]);

  const { isLoading: isTrackerLoading, error: trackerError } = useHandTracking(videoRef, handleHandData);
  
  const openApp = useCallback((appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (app) {
      setIsAppGridVisible(false);
      const windowWidth = app.id === 'draw' ? 800 : 600;
      const windowHeight = app.id === 'draw' ? 600 : 450;
      setActiveWindow({
        id: app.id,
        title: app.label,
        content: app.content,
        position: {
          x: (window.innerWidth - windowWidth) / 2,
          y: (window.innerHeight - windowHeight) / 2,
        },
        size: { width: windowWidth, height: windowHeight }
      });
    }
  }, [apps]);

  // Main Interaction Loop
  useEffect(() => {
    if (isDragging && activeWindow) {
      const draggingHand = hands.find(h => pinchStartRef.current[h.id]?.startsWith(`drag-`));
      if (draggingHand) {
        const cursorX = (1 - draggingHand.cursorPosition.x) * window.innerWidth;
        const cursorY = draggingHand.cursorPosition.y * window.innerHeight;
        setActiveWindow(prev => prev ? { ...prev, position: { x: cursorX - dragOffset.x, y: cursorY - dragOffset.y } } : null);
      } else {
        setIsDragging(false);
      }
    }

    if (activeWindow && hands.length === 2 && hands.every(h => h.gesture === 'PINCH_DOWN' || h.gesture === 'PINCH_HELD')) {
        if (!resizeStartRef.current) {
            setIsResizing(true);
            const distance = getDistance(hands[0].cursorPosition, hands[1].cursorPosition);
            resizeStartRef.current = { distance, width: activeWindow.size.width, height: activeWindow.size.height };
        } else {
            const currentDistance = getDistance(hands[0].cursorPosition, hands[1].cursorPosition);
            const scale = currentDistance / resizeStartRef.current.distance;
            const newWidth = Math.max(300, resizeStartRef.current.width * scale);
            const newHeight = Math.max(200, resizeStartRef.current.height * scale);
            setActiveWindow(prev => prev ? { ...prev, size: { width: newWidth, height: newHeight } } : null);
        }
    } else if (resizeStartRef.current) {
        setIsResizing(false);
        resizeStartRef.current = null;
    }

    let currentHover: string | null = null;
    hands.forEach(hand => {
      if (isAppGridVisible && !activeWindow) {
        apps.forEach(app => {
          if (isCursorOverElement(hand, appRefs.current.get(app.id) || null)) {
            currentHover = app.id;
          }
        });
      }
      
      // Dock hover logic (can be expanded if needed)
      const dockButtons = ['grid', 'camera', 'zoom', 'recenter'];
      dockButtons.forEach(id => {
          if (isCursorOverElement(hand, dockRefs.current.get(id) || null)) {
            // Can add hover state for dock buttons if needed
          }
      });

      if (hand.gesture === 'PINCH_DOWN') {
        let pinchedElementIdForDrag: string | null = null;
        let actionTaken = false;

        // Window interactions
        if (activeWindow && !isResizing && hands.length === 1) {
            if (isCursorOverElement(hand, windowDragHandleRef.current)) {
                // Start dragging
                pinchedElementIdForDrag = `drag-${activeWindow.id}`;
                setIsDragging(true);
                const cursorX = (1 - hand.cursorPosition.x) * window.innerWidth;
                const cursorY = hand.cursorPosition.y * window.innerHeight;
                setDragOffset({ x: cursorX - activeWindow.position.x, y: cursorY - activeWindow.position.y });
                actionTaken = true;
            } else if (isCursorOverElement(hand, windowCloseButtonRef.current)) {
                // Close window immediately
                setActiveWindow(null);
                actionTaken = true;
            }
        }

        // App Grid interactions
        if (!actionTaken && isAppGridVisible && !activeWindow) {
            const pinchedApp = apps.find(app => isCursorOverElement(hand, appRefs.current.get(app.id) || null));
            if (pinchedApp) {
                openApp(pinchedApp.id);
                actionTaken = true;
            }
        }

        // Dock interactions
        if (!actionTaken) {
            if (isCursorOverElement(hand, dockRefs.current.get('grid') || null)) {
                setIsAppGridVisible(v => !v);
            } else if (isCursorOverElement(hand, dockRefs.current.get('camera') || null)) {
                toggleFacingMode();
            } else if (isCursorOverElement(hand, dockRefs.current.get('zoom') || null)) {
                toggleZoom();
            } else if (isCursorOverElement(hand, dockRefs.current.get('recenter') || null)) {
                recenter();
            }
        }
        
        pinchStartRef.current[hand.id] = pinchedElementIdForDrag;

      } else if (hand.gesture === 'PINCH_UP') {
        const releasedElementId = pinchStartRef.current[hand.id];
        
        // Only thing to do on PINCH_UP is stop dragging
        if (releasedElementId?.startsWith('drag-')) {
          setIsDragging(false);
        }
        
        // Always clear the ref for this hand on release
        pinchStartRef.current[hand.id] = null;
      }
    });
    setHoveredAppId(currentHover);
  }, [hands, apps, openApp, isDragging, isResizing, activeWindow, dragOffset, isAppGridVisible, recenter, toggleFacingMode, toggleZoom]);

  const renderContent = () => {
    if (isTrackerLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white" style={{ transform: 'translateZ(-1px)' }}>
          <LoadingSpinner />
          <p className="text-xl font-semibold">Initializing Spatial Engine...</p>
        </div>
      );
    }

    if (trackerError || cameraError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-md p-6 bg-black/50 backdrop-blur-md rounded-xl">
            <p className="text-2xl text-red-400 font-bold mb-4">Error</p>
            <p className="text-lg mb-6">{trackerError || cameraError}</p>
            </div>
        </div>
      );
    }

    const pinchingHand = hands.find(h => h.gesture === 'PINCH_DOWN' || h.gesture === 'PINCH_HELD');
    const pressedAppId = pinchingHand && pinchStartRef.current[pinchingHand.id]?.startsWith('app-')
      ? pinchStartRef.current[pinchingHand.id]?.substring(4)
      : null;


    return (
      <>
        <BottomDock 
          isGridVisible={isAppGridVisible}
          onToggleGrid={() => setIsAppGridVisible(v => !v)}
          onToggleCamera={toggleFacingMode}
          zoomLevel={zoom}
          onToggleZoom={toggleZoom}
          onRecenter={recenter}
          dockRefs={dockRefs}
          isCollapsed={isDockCollapsed}
          onExpand={() => resetDockTimer()}
        />
        
        <AppGrid 
            apps={apps} 
            appRefs={appRefs}
            hoveredAppId={hoveredAppId}
            pressedAppId={pressedAppId}
            isVisible={isAppGridVisible && !activeWindow}
        />

        {activeWindow && (
          <Window
            title={activeWindow.title}
            position={activeWindow.position}
            size={activeWindow.size}
            onClose={() => {
              setActiveWindow(null);
            }}
            dragHandleRef={windowDragHandleRef}
            closeButtonRef={windowCloseButtonRef}
            isResizing={isResizing}
          >
            {activeWindow.content}
          </Window>
        )}
        <HandRenderer hands={hands} />
        {hands.length === 0 && !activeWindow && isAppGridVisible &&(
            <div className="absolute bottom-24 w-full text-center p-4 z-20" style={{ transform: 'translateZ(200px)'}}>
                <p className="text-lg text-white bg-black/40 backdrop-blur-xl rounded-full px-8 py-4 inline-block shadow-lg border border-white/20">
                    Show your hand to the camera to begin
                </p>
            </div>
        )}
      </>
    );
  };

  const renderUI = () => (
    <div 
      className="absolute inset-0" 
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0" style={{ transform: worldTransform }}>
          {renderContent()}
      </div>
    </div>
  );
  
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center font-sans select-none">
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ transform: `scaleX(${facingMode === 'user' ? -1 : 1})` }}
      />
      {isVrMode ? (
        <div className="vr-container absolute inset-0">
          <div className="left-eye">
            <div className="eye-content">{renderUI()}</div>
          </div>
          <div className="vr-divider" />
          <div className="right-eye">
            <div className="eye-content">{renderUI()}</div>
          </div>
        </div>
      ) : (
        renderUI()
      )}
    </main>
  );
};

export default App;
