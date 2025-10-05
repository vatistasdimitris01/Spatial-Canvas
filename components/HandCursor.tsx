import React, { useState, useEffect } from 'react';
import { HandData } from '../hooks/useHandTracking';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

const CURSOR_RADIUS = 10;
const TAP_EFFECT_RADIUS = 15;
const Z_SCALE_FACTOR = 10;

// FIX: Moved getScale to module scope to be accessible by both HandSkeleton and HandCursor.
const getScale = (z: number) => Math.max(0.1, 1 - z * Z_SCALE_FACTOR);

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Palm
];

const INDEX_FINGER_PARTS = [5, 6, 7, 8];

interface HandSkeletonProps {
    landmarks: NormalizedLandmark[];
    isPointing: boolean;
}

const HandSkeleton: React.FC<HandSkeletonProps> = ({ landmarks, isPointing }) => {
    if (!landmarks || landmarks.length === 0) return null;

    const landmarkPoints = landmarks.map(lm => ({
        x: (1 - lm.x) * window.innerWidth,
        y: lm.y * window.innerHeight,
        z: lm.z || 0,
    }));

    return (
        <g>
            {HAND_CONNECTIONS.map(([startIdx, endIdx], i) => {
                const start = landmarkPoints[startIdx];
                const end = landmarkPoints[endIdx];
                if (!start || !end) return null;

                const isIndexBone = INDEX_FINGER_PARTS.includes(startIdx) && INDEX_FINGER_PARTS.includes(endIdx);
                const color = isPointing && isIndexBone ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.4)';

                const avgZ = (start.z + end.z) / 2;
                const strokeWidth = getScale(avgZ) * 4;

                return (
                    <line
                        key={i}
                        x1={start.x} y1={start.y}
                        x2={end.x} y2={end.y}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{ transition: 'stroke 0.2s ease-in-out' }}
                    />
                );
            })}
            {landmarkPoints.map((lm, i) => {
                const isIndexJoint = INDEX_FINGER_PARTS.includes(i);
                const color = isPointing && isIndexJoint ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.6)';
                const radius = getScale(lm.z) * 4;

                return (
                    <circle
                        key={i}
                        cx={lm.x}
                        cy={lm.y}
                        r={radius}
                        fill={color}
                        style={{ transition: 'fill 0.2s ease-in-out' }}
                    />
                );
            })}
        </g>
    );
};


interface HandCursorProps {
    hand: HandData;
}

const HandCursor: React.FC<HandCursorProps> = ({ hand }) => {
    const [tapEvents, setTapEvents] = useState<{ x: number, y: number, id: number }[]>([]);

    useEffect(() => {
        if (hand.gesture === 'TAP_DOWN') {
            const indexTip = hand.landmarks[8];
            const thumbTip = hand.landmarks[4];
            const tapX = (1 - (indexTip.x + thumbTip.x) / 2) * window.innerWidth;
            const tapY = ((indexTip.y + thumbTip.y) / 2) * window.innerHeight;

            setTapEvents(prev => [...prev, { x: tapX, y: tapY, id: Date.now() }]);
        }
    }, [hand.gesture, hand.landmarks]);

    const handleAnimationEnd = (id: number) => {
        setTapEvents(prev => prev.filter(p => p.id !== id));
    };
    
    if (!hand.landmarks || hand.landmarks.length === 0) {
        return null;
    }
    
    const indexTip = hand.landmarks[8];
    const isTapped = hand.gesture === 'TAP_HELD' || hand.gesture === 'TAP_DOWN';

    const cursorX = (1 - indexTip.x) * window.innerWidth;
    const cursorY = indexTip.y * window.innerHeight;
    const cursorZ = indexTip.z || 0;
    
    const scale = getScale(cursorZ);
    const finalRadius = CURSOR_RADIUS * scale;

    const Z_SCALING_FACTOR_DIST = 4000;
    const UI_PLANE_Z = -600; // Aligned with the AppGrid's Z-position
    const handZ = (hand.landmarks[8]?.z || 0) * Z_SCALING_FACTOR_DIST;
    
    // Distance from hand to the UI plane. Positive is in front, negative is behind.
    const distance = handZ - UI_PLANE_Z; 
    
    // Convert pixel distance to a more readable "cm" unit for display
    const distanceCm = (distance / 30).toFixed(0); 
    const distanceText = `${distance > 0 ? '+' : ''}${distanceCm} cm`;
    
    return (
        <g>
            {tapEvents.map(p => (
                <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={TAP_EFFECT_RADIUS}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="3"
                    className="animate-tap-ripple"
                    onAnimationEnd={() => handleAnimationEnd(p.id)}
                />
            ))}

            <g style={{ transform: `translate(${cursorX}px, ${cursorY}px)` }}>
                <circle
                    r={finalRadius}
                    fill={hand.isPointing ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.3)"}
                    stroke={hand.isPointing ? "rgb(191, 219, 254)" : "white"}
                    strokeWidth={isTapped ? 3 : 2}
                    style={{ 
                        transition: 'all 0.2s ease-out',
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
        </g>
    );
};


interface HandRendererProps {
  hands: HandData[];
}

export const HandRenderer: React.FC<HandRendererProps> = ({ hands }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
        <defs>
            <filter id="cursorGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            </filter>
        </defs>
        {hands.map((hand) => (
            <React.Fragment key={hand.id}>
                <HandSkeleton landmarks={hand.landmarks} isPointing={hand.isPointing} />
                <HandCursor hand={hand} />
            </React.Fragment>
        ))}
    </svg>
  );
};