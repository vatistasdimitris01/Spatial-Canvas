
import React from 'react';
import { DisplayMode } from '../../types';

interface SettingsContentProps {
    displayMode: DisplayMode;
    setDisplayMode: (mode: DisplayMode) => void;
    recenterView: () => void;
}

const SettingsRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg">
        <span className="font-medium">{label}</span>
        <div>{children}</div>
    </div>
);

export const SettingsContent: React.FC<SettingsContentProps> = ({ displayMode, setDisplayMode, recenterView }) => {
  return (
    <div className="w-full h-full flex flex-col items-center text-white p-6 gap-4">
        <h3 className="text-2xl font-semibold mb-4">Settings</h3>
        
        <SettingsRow label="Display Mode">
            <div className="flex items-center bg-white/10 rounded-lg p-1 space-x-1">
                {(['AR', 'MR', 'VR'] as const).map(mode => (
                    <button 
                        key={mode} 
                        onClick={() => setDisplayMode(mode)}
                        className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors duration-200 ${displayMode === mode ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        </SettingsRow>
        
        <SettingsRow label="View Orientation">
            <button onClick={recenterView} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">
                Recenter View
            </button>
        </SettingsRow>

        <p className="text-sm text-white/60 mt-auto text-center">
            Switch between AR, MR, and VR modes. VR is best experienced with a mobile headset.
        </p>
    </div>
  );
};
