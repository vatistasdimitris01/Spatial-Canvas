
import React from 'react';

export const ZoomIcon: React.FC<{ zoomLevel: number }> = ({ zoomLevel }) => (
    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white tracking-tighter">
        <span>{zoomLevel === 1 ? '1x' : '0.5'}</span>
    </div>
);
