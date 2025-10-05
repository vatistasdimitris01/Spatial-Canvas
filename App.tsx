
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandTracking, HandData } from './hooks/useHandTracking';
import { useCamera } from './hooks/useCamera';
import { useHeadTracking } from './hooks/useHeadTracking';
import { HandRenderer } from './components/HandCursor';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppGrid } from './components/AppGrid';
import { Window } from './components/Window';
import { BottomDock } from './components/BottomDock';
import { ActiveWindow, Photo, DisplayMode } from './types';
import { getApps } from './apps';

const DOCK_ACTIVITY_TIMEOUT = 4000; // 4 seconds

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

// Use a positive scaling factor so that Z-coordinates align with CSS transforms (negative is further away).
const Z_SCALING_FACTOR = 4000;
const getHandZ = (hand: HandData) => (hand.landmarks[8]?.z || 0) * Z_SCALING_FACTOR;

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapStartRef = useRef<{ [key: number]: string | null }>({});
  const resizeStartRef = useRef<{ distance: number; width: number; height: number} | null>(null);
  const appRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const dockRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const windowRef = useRef<HTMLDivElement>(null);
  const windowDragHandleRef = useRef<HTMLDivElement>(null);
  const windowCloseButtonRef = useRef<HTMLButtonElement>(null);
  const dockActivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hands, setHands] = useState<HandData[]>([]);
  const [activeWindow, setActiveWindow] = useState<ActiveWindow | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [pressedAppId, setPressedAppId] = useState<string | null>(null);
  const [isAppGridVisible, setIsAppGridVisible] = useState(true);
  const [isDockActive, setIsDockActive] = useState(true);
  const [isWindowHovered, setIsWindowHovered] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  const [photos, setPhotos] = useState<Photo[]>([]);

  const { videoStream, cameraError, facingMode, toggleFacingMode } = useCamera();
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
    
    setIsTakingPhoto(true);
    setTimeout(() => setIsTakingPhoto(false), 300);
  }, [videoRef, facingMode]);
  
  const apps = getApps({ photos });

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const activateDock = useCallback(() => {
    if (dockActivityTimer.current) {
        clearTimeout(dockActivityTimer.current);
    }
    setIsDockActive(true);
    dockActivityTimer.current = setTimeout(() => {
        setIsDockActive(false);
    }, DOCK_ACTIVITY_TIMEOUT);
  }, []);

  const handleHandData = useCallback((handData: HandData[]) => {
    setHands(handData);
    if(handData.length > 0) {
        activateDock();
    }
  }, [activateDock]);

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

  const getAppPositionZ = useCallback((appId: string): number => {
      const index = apps.findIndex(a => a.id === appId);
      if (index === -1) return -Infinity;
      const arc = { radius: 800, angle: 8 };
      const numIcons = apps.length;
      const angle = (index - (numIcons - 1) / 2) * arc.angle;
      const zRelative = -arc.radius * (1 - Math.cos(angle * Math.PI / 180));
      return zRelative - 600; // AppGrid container is at translateZ(-600px)
  }, [apps]);

  // Main Interaction Loop
  useEffect(() => {
    if (isDragging && activeWindow) {
      const draggingHand = hands.find(h => tapStartRef.current[h.id]?.startsWith(`drag-`));
      if (draggingHand) {
        const cursorX = (1 - draggingHand.cursorPosition.x) * window.innerWidth;
        const cursorY = draggingHand.cursorPosition.y * window.innerHeight;
        setActiveWindow(prev => prev ? { ...prev, position: { x: cursorX - dragOffset.x, y: cursorY - dragOffset.y } } : null);
      } else {
        setIsDragging(false);
      }
    }

    if (activeWindow && hands.length === 2 && hands.every(h => h.gesture === 'TAP_DOWN' || h.gesture === 'TAP_HELD')) {
        const windowZ = -400;
        const handsAreNearWindow = hands.every(h => Math.abs(getHandZ(h) - windowZ) < 200);
        if (handsAreNearWindow) {
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
        }
    } else if (resizeStartRef.current) {
        setIsResizing(false);
        resizeStartRef.current = null;
    }

    let currentHover: string | null = null;
    let isHandOverWindow = false;
    let currentPressedId: string | null = null;

    if (activeWindow) {
        if (hands.some(hand => isCursorOverElement(hand, windowRef.current))) {
            isHandOverWindow = true;
        }
    }
    setIsWindowHovered(isHandOverWindow);

    if (isAppGridVisible && !activeWindow) {
        const handAndApp = hands
            .map(hand => ({ hand, app: apps.find(app => isCursorOverElement(hand, appRefs.current.get(app.id) || null)) }))
            .find(item => item.app);

        if (handAndApp) {
            const { hand, app } = handAndApp;
            if (hand.isPointing) {
                const handZ = getHandZ(hand);
                const appZ = getAppPositionZ(app!.id);
                
                if (Math.abs(handZ - appZ) < 150) { // Hover threshold
                    currentHover = app!.id;
                    if (handZ < appZ + 20) { // Press threshold (hand is "behind" the element)
                        currentPressedId = app!.id;
                    }
                }
            }
        }
    }
    setHoveredAppId(currentHover);
    setPressedAppId(currentPressedId);

    hands.forEach(hand => {
      if(hand.middleIndexDoubleTap) {
        takePhoto();
      }

      const handZ = getHandZ(hand);
      let actionTaken = false;

      if (hand.isPointing && hand.gesture === 'TAP_DOWN') {
        let tappedElementIdForDrag: string | null = null;
        
        // Window interactions
        if (activeWindow && !isResizing && hands.length === 1) {
            const windowZ = -400;

            if (isCursorOverElement(hand, windowDragHandleRef.current)) {
                if (Math.abs(handZ - windowZ) < 150) { // Must be near the window plane to drag
                    tappedElementIdForDrag = `drag-${activeWindow.id}`;
                    setIsDragging(true);
                    const cursorX = (1 - hand.cursorPosition.x) * window.innerWidth;
                    const cursorY = hand.cursorPosition.y * window.innerHeight;
                    setDragOffset({ x: cursorX - activeWindow.position.x, y: cursorY - activeWindow.position.y });
                    actionTaken = true;
                }
            } else if (isCursorOverElement(hand, windowCloseButtonRef.current)) {
                if (handZ < windowZ) { // Must push "through" the window to close
                    setActiveWindow(null);
                    setIsAppGridVisible(true);
                    actionTaken = true;
                }
            }
        }

        // App Grid interactions
        if (!actionTaken && isAppGridVisible && !activeWindow && pressedAppId) {
            const tappedApp = apps.find(app => app.id === pressedAppId && isCursorOverElement(hand, appRefs.current.get(app.id) || null));
            if(tappedApp) {
                openApp(tappedApp.id);
                actionTaken = true;
            }
        }

        // Dock interactions
        if (!actionTaken) {
            const dockZ = 0; // Dock is at z=0 plane
            if (handZ < dockZ + 20) { // Must push through the screen plane
                if (isCursorOverElement(hand, dockRefs.current.get('grid') || null)) {
                    setIsAppGridVisible(v => !v);
                    if (activeWindow) setActiveWindow(null);
                    actionTaken = true;
                } else if (isCursorOverElement(hand, dockRefs.current.get('camera') || null)) {
                    toggleFacingMode();
                    actionTaken = true;
                } else if (isCursorOverElement(hand, dockRefs.current.get('recenter') || null)) {
                    recenter();
                    actionTaken = true;
                }
            }
        }
        
        tapStartRef.current[hand.id] = tappedElementIdForDrag;

      } else if (hand.gesture === 'TAP_UP') {
        const releasedElementId = tapStartRef.current[hand.id];
        
        if (releasedElementId?.startsWith('drag-')) {
          setIsDragging(false);
        }
        
        tapStartRef.current[hand.id] = null;
      }
    });

  }, [hands, apps, openApp, isDragging, isResizing, activeWindow, dragOffset, isAppGridVisible, recenter, toggleFacingMode, takePhoto, getAppPositionZ, pressedAppId]);
  
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

    return (
      <>
        <BottomDock 
          isGridVisible={isAppGridVisible}
          onToggleGrid={() => {
            setIsAppGridVisible(v => !v);
            if(activeWindow) setActiveWindow(null);
          }}
          onToggleCamera={toggleFacingMode}
          onRecenter={recenter}
          dockRefs={dockRefs}
          isActive={isDockActive}
          onMouseEnter={activateDock}
          isBlurred={!!activeWindow}
        />
        
        <AppGrid 
            apps={apps} 
            appRefs={appRefs}
            hoveredAppId={hoveredAppId}
            pressedAppId={pressedAppId}
            isVisible={isAppGridVisible && !activeWindow}
            isBlurred={!!activeWindow}
        />

        {activeWindow && (
          <Window
            windowRef={windowRef}
            title={activeWindow.title}
            position={activeWindow.position}
            size={activeWindow.size}
            onClose={() => {
              setActiveWindow(null);
              setIsAppGridVisible(true);
            }}
            dragHandleRef={windowDragHandleRef}
            closeButtonRef={windowCloseButtonRef}
            isResizing={isResizing}
            isHovered={isWindowHovered}
          >
            {
              React.createElement(
                activeWindow.content,
                activeWindow.id === 'draw' ? { hands, windowRef } : undefined
              )
            }
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

  const renderUI = (eye: 'left' | 'right') => {
    // Average human IPD is ~64mm. We'll use a pixel value for the offset.
    const eyeOffset = eye === 'left' ? -32 : 32;
    return (
        <div
            className="absolute inset-0"
            style={{
                perspective: '1200px',
                perspectiveOrigin: `calc(50% - ${eyeOffset}px) 50%`,
                transformStyle: 'preserve-3d',
            }}
        >
            <div className="absolute inset-0" style={{ transform: worldTransform, transformStyle: 'preserve-3d' }}>
                {renderContent()}
            </div>
        </div>
    );
  };
  
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
      {isTakingPhoto && <div className="absolute inset-0 bg-white z-50 animate-photo-flash pointer-events-none"></div>}
      <div className="vr-container absolute inset-0">
        <div className="left-eye">
          <div className="eye-content">{renderUI('left')}</div>
        </div>
        <div className="vr-divider" />
        <div className="right-eye">
          <div className="eye-content">{renderUI('right')}</div>
        </div>
      </div>
    </main>
  );
};

export default App;