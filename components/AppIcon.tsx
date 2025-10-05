
import React from 'react';

interface AppIconProps {
  label: string;
  icon: React.ReactNode;
  isHovered: boolean;
  isPressed: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({ label, icon, isHovered, isPressed }) => {
  return (
    <div className="flex flex-col items-center gap-4 w-28 text-center select-none group">
      <div
        className="relative w-24 h-24 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1.2)]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `
            scale(${isPressed ? 0.95 : isHovered ? 1.15 : 1}) 
            translateZ(${isPressed ? '-20px' : isHovered ? '50px' : '0px'})
            rotateX(${isHovered && !isPressed ? '-10deg' : '0deg'})
          `,
        }}
      >
        {/* Subtle glow effect on hover */}
        <div className={`absolute inset-0 bg-white/40 rounded-full blur-xl transition-opacity duration-300 ${isHovered && !isPressed ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Glass container */}
        <div className={`absolute inset-0 rounded-full backdrop-blur-lg border border-white/10 flex items-center justify-center overflow-hidden shadow-lg transition-colors duration-200 ${isPressed ? 'bg-black/30' : 'bg-black/10'}`}>
           <div className="scale-[0.6]">
            {icon}
           </div>
        </div>
      </div>
      <span 
        className="text-white text-sm font-medium transition-opacity duration-300" 
        style={{ opacity: isHovered ? 1 : 0.8, transform: isHovered ? 'translateY(5px)' : 'translateY(0)' }}
      >
        {label}
      </span>
    </div>
  );
};