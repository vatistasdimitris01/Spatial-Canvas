
import React from 'react';
import { AppIcon } from './AppIcon';
import { AppDefinition } from '../types';

interface AppGridProps {
  apps: AppDefinition[];
  appRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  hoveredAppId: string | null;
  pressedAppId: string | null;
  isVisible: boolean;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, appRefs, hoveredAppId, pressedAppId, isVisible }) => {
  const numIcons = apps.length;
  const arc = { radius: 800, angle: 8 };
  const horizontalSpacing = 20;

  return (
    <div 
        className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500"
        style={{ 
            opacity: isVisible ? 1 : 0, 
            pointerEvents: isVisible ? 'auto' : 'none',
            transform: 'translateZ(-600px)' 
        }}
    >
        <div className="flex justify-center" style={{ gap: `${horizontalSpacing}px` }}>
            {apps.map((app, index) => {
                const angle = (index - (numIcons - 1) / 2) * arc.angle;
                const x = Math.sin(angle * Math.PI / 180) * arc.radius;
                const z = -arc.radius * (1 - Math.cos(angle * Math.PI / 180));

                const style: React.CSSProperties = {
                    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${angle}deg)`,
                };

                return (
                <div
                    key={app.id}
                    ref={el => {
                    if (el) {
                        appRefs.current.set(app.id, el);
                    } else {
                        appRefs.current.delete(app.id);
                    }
                    }}
                    style={style}
                >
                    <AppIcon
                    label={app.label}
                    icon={app.icon}
                    isHovered={hoveredAppId === app.id}
                    isPressed={pressedAppId === app.id}
                    />
                </div>
                );
            })}
        </div>
    </div>
  );
};
