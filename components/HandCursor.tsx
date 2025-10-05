
import React, { useState, useEffect } from 'react';
import { HandData } from '../hooks/useHandTracking';

const CURSOR_RADIUS = 10;
const PINCH_EFFECT_RADIUS = 15;

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
    if (endAngle >= 359.99) endAngle = 359.99;
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

interface HandCursorProps {
    hand: HandData;
    dwellProgress?: number;
}

const HandCursor: React.FC<HandCursorProps> = ({ hand, dwellProgress = 0 }) => {
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
    
    const scale = 1 - cursorZ * 4;
    const finalRadius = CURSOR_RADIUS * scale;

    const loaderPath = dwellProgress > 0 && dwellProgress < 1
        ? describeArc(0, 0, finalRadius + 5, 0, dwellProgress * 360)
        : null;
    
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
                 {loaderPath && (
                    <path
                        d={loaderPath}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.9)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                )}
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
            </g>
        </svg>
    );
};


interface HandRendererProps {
  hands: HandData[];
  dwellProgress: number;
}

export const HandRenderer: React.FC<HandRendererProps> = ({ hands, dwellProgress }) => {
  return (
    <>
      {hands.map((hand) => (
        <HandCursor key={hand.id} hand={hand} dwellProgress={dwellProgress} />
      ))}
    </>
  );
};