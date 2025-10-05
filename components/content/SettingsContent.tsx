
import React from 'react';

interface SettingsContentProps {
    isVrMode: boolean;
    toggleVrMode: () => void;
    recenterView: () => void;
}

const SettingsRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between w-full p-4 bg-white/5 rounded-lg">
        <span className="font-medium">{label}</span>
        <div>{children}</div>
    </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 ease-in-out ${checked ? 'bg-blue-500' : 'bg-gray-600'}`}>
        <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-7' : 'translate-x-1'}`}/>
    </button>
);

export const SettingsContent: React.FC<SettingsContentProps> = ({ isVrMode, toggleVrMode, recenterView }) => {
  return (
    <div className="w-full h-full flex flex-col items-center text-white p-6 gap-4">
        <h3 className="text-2xl font-semibold mb-4">Settings</h3>
        
        <SettingsRow label="VR Mode (Stereoscopic)">
            <Toggle checked={isVrMode} onChange={toggleVrMode} />
        </SettingsRow>
        
        <SettingsRow label="View Orientation">
            <button onClick={recenterView} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">
                Recenter View
            </button>
        </SettingsRow>

        <p className="text-sm text-white/60 mt-auto text-center">
            VR Mode is best experienced with a mobile headset. Head tracking uses your device's orientation sensors.
        </p>
    </div>
  );
};
