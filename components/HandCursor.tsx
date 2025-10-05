
import React from 'react';
import { Gesture } from '../hooks/useHandTracking';

interface HandCursorProps {
  x: number;
  y: number;
  gesture: Gesture;
}

export const HandCursor: React.FC<HandCursorProps> = ({ x, y, gesture }) => {
  const cursorX = (1 - x) * window.innerWidth;
  const cursorY = y * window.innerHeight;

  const cursorStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${cursorX}px`,
    top: `${cursorY}px`,
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.1s ease-out, opacity 0.3s ease',
    zIndex: 100,
    pointerEvents: 'none',
  };
  
  const isPinched = gesture === 'PINCH_HELD' || gesture === 'PINCH_DOWN';
  const scale = gesture === 'PINCH_DOWN' ? 0.75 : isPinched ? 0.85 : 1;

  const ringSize = '28px';
  const dotSize = isPinched ? '4px' : '6px';
  const ringThickness = isPinched ? '3px' : '2px';

  return (
    <div style={cursorStyle}>
      <div
        className="rounded-full border-white/80 backdrop-blur-sm transition-all duration-200 ease-out flex items-center justify-center"
        style={{
          width: ringSize,
          height: ringSize,
          borderWidth: ringThickness,
          transform: `scale(${scale})`,
        }}
      >
        <div
          className="rounded-full bg-white transition-all duration-200 ease-out"
          style={{ width: dotSize, height: dotSize }}
        ></div>
      </div>
    </div>
  );
};
