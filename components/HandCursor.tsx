
import React from 'react';
import { HandData } from '../hooks/useHandTracking';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

const HAND_CONNECTIONS: number[][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [5, 9],
    [9, 10], [10, 11], [11, 12], // Middle
    [9, 13],
    [13, 14], [14, 15], [15, 16], // Ring
    [13, 17],
    [0, 17],
    [17, 18], [18, 19], [19, 20] // Pinky
];

const Z_SCALE_FACTOR = 4;
const BASE_RADIUS = 3;
const BASE_STROKE_WIDTH = 2.5;

interface HandSkeletonProps {
  landmarks: NormalizedLandmark[];
  gesture: HandData['gesture'];
}

const HandSkeleton: React.FC<HandSkeletonProps> = ({ landmarks, gesture }) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  const landmarkPoints = landmarks.map(lm => ({
    x: (1 - lm.x) * window.innerWidth,
    y: lm.y * window.innerHeight,
    z: lm.z,
  }));
  
  const isPinched = gesture === 'PINCH_HELD' || gesture === 'PINCH_DOWN';

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 100 }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      </defs>
      <g style={{ filter: isPinched ? 'url(#glow)' : 'none', transition: 'filter 0.2s ease-out' }}>
        {HAND_CONNECTIONS.map(([startIdx, endIdx], i) => {
          const start = landmarkPoints[startIdx];
          const end = landmarkPoints[endIdx];
          if (!start || !end) return null;
          
          const avgZ = ((start.z || 0) + (end.z || 0)) / 2;
          const strokeWidth = Math.max(1, BASE_STROKE_WIDTH * (1 - avgZ * Z_SCALE_FACTOR));
          const opacity = isPinched ? 1 : 0.8;

          return (
            <line
              key={`line-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={`rgba(255, 255, 255, ${opacity})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ transition: 'stroke-opacity 0.2s ease-out' }}
            />
          );
        })}
        {landmarkPoints.map((lm, i) => {
          const radius = Math.max(1, BASE_RADIUS * (1 - (lm.z || 0) * Z_SCALE_FACTOR));
          const isPinchPoint = isPinched && (i === 4 || i === 8);
          const finalRadius = isPinchPoint ? radius * 1.5 : radius;
          const opacity = isPinched ? 1 : 0.9;
          
          return (
            <circle
              key={`point-${i}`}
              cx={lm.x}
              cy={lm.y}
              r={finalRadius}
              fill={`rgba(255, 255, 255, ${opacity})`}
              style={{ transition: 'r 0.2s ease-out, fill-opacity 0.2s ease-out' }}
            />
          );
        })}
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
        <HandSkeleton key={hand.id} landmarks={hand.landmarks} gesture={hand.gesture} />
      ))}
    </>
  );
};
