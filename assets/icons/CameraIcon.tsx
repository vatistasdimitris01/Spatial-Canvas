
import React from 'react';

export const CameraIcon = () => (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="30" fill="url(#paint0_linear_camera)"/>
        <rect x="12" y="18" width="36" height="24" rx="4" stroke="white" strokeWidth="3"/>
        <circle cx="30" cy="30" r="7" stroke="white" strokeWidth="3"/>
        <circle cx="41" cy="23" r="2" fill="white"/>
        <defs>
            <linearGradient id="paint0_linear_camera" x1="30" y1="0" x2="30" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#555555"/>
                <stop offset="1" stopColor="#333333"/>
            </linearGradient>
        </defs>
    </svg>
);
