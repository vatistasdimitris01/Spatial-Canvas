
import React, { useState, useEffect } from 'react';
import { HandData } from '../hooks/useHandTracking';

const CURSOR_RADIUS = 10;
const PINCH_EFFECT_RADIUS = 15;

interface HandCursorProps {
    hand: HandData;
}

const HandCursor: React.FC<HandCursorProps> = ({ hand }) => {
    const [pinchEvents, setPinchEvents] = useState<{ x: number, y: number, id: number }[]>([]);

    useEffect(() => {
        if (hand.gesture === 'PINCH_DOWN') {
            const indexTip = hand.landmarks[8];
            const thumbTip = hand.landmarks[4];
            const pinchX = (1 - (indexTip.x + thumbTip.x) / 2) * window.innerWidth;
            const pinchY = ((indexTip.y + thumbTip.y) / 2) * window.innerHeight;

            setPinchEvents(prev => [...prev, { x: pinchX, y: pinchY, id: Date.now() }]);
        }
    }, [hand.gesture, hand.landmarks]);

    const handleAnimationEnd = (id: number) => {
        setPinchEvents(prev => prev.filter(p => p.id !== id));
    };
    
    if (!hand.landmarks || hand.landmarks.length === 0) {
        return null;
    }
    
    const indexTip = hand.landmarks[8];
    const isPinched = hand.gesture === 'PINCH_HELD' || hand.gesture === 'PINCH_DOWN';

    const cursorX = (1 - indexTip.x) * window.innerWidth;
    const cursorY = indexTip.y * window.innerHeight;
    const cursorZ = indexTip.z || 0;
    
    const scale = 1 + cursorZ * 4; // Scale becomes smaller as hand moves away
    const finalRadius = CURSOR_RADIUS * scale;

    const Z_SCALING_FACTOR = 4000;
    const UI_PLANE_Z = -600; // Aligned with the AppGrid's Z-position
    const handZ = (hand.landmarks[8]?.z || 0) * Z_SCALING_FACTOR;
    
    // Distance from hand to the UI plane. Positive is in front, negative is behind.
    const distance = handZ - UI_PLANE_Z; 
    
    // Convert pixel distance to a more readable "cm" unit for display
    const distanceCm = (distance / 30).toFixed(0); 
    const distanceText = `${distance > 0 ? '+' : ''}${distanceCm} cm`;
    
    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
            <defs>
                <filter id="cursorGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                </filter>
            </defs>
            
            {pinchEvents.map(p => (
                <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={PINCH_EFFECT_RADIUS}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="3"
                    className="animate-pinch-pulse"
                    onAnimationEnd={() => handleAnimationEnd(p.id)}
                />
            ))}

            <g style={{ transform: `translate(${cursorX}px, ${cursorY}px)` }}>
                <circle
                    r={finalRadius}
                    fill="rgba(255, 255, 255, 0.3)"
                    stroke="white"
                    strokeWidth={isPinched ? 3 : 2}
                    style={{ 
                        transition: 'stroke-width 0.2s ease-out, r 0.1s linear',
                        filter: isPinched ? 'url(#cursorGlow)' : 'none'
                    }}
                />
                 <text
                    x={finalRadius + 8}
                    y={finalRadius / 2}
                    fill="white"
                    fontSize="12"
                    fontWeight="500"
                    fontFamily="sans-serif"
                    stroke="black"
                    strokeWidth="0.3"
                    paintOrder="stroke"
                    style={{textShadow: '0 0 3px black'}}
                >
                    {distanceText}
                </text>
            </g>
        </svg>
    );
};


interface HandRendererProps {
  hands: HandData[];
}

export const HandRenderer: React.FC<HandRendererProps> = ({ hands }) => {
  return (
    <>
      {hands.map((hand) => (
        <HandCursor key={hand.id} hand={hand} />
      ))}
    </>
  );
};
