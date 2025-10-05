
import React from 'react';

interface AppIconProps {
  label: string;
  icon: React.ReactNode;
  isHovered: boolean;
  isPressed: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({ label, icon, isHovered, isPressed }) => {
  return (
    <div className="flex flex-col items-center gap-2 w-24 text-center select-none">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer"
        style={{
          transform: `scale(${isPressed ? 0.9 : isHovered ? 1.15 : 1}) translateY(${isHovered ? '-4px' : '0px'})`,
          filter: isHovered ? 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))' : 'none',
        }}
      >
        {icon}
      </div>
      <span className="text-white text-xs font-medium transition-opacity duration-200" style={{ opacity: isHovered ? 1 : 0.8 }}>{label}</span>
    </div>
  );
};
