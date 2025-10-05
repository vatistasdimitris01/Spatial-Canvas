
import React from 'react';
import { CameraIcon } from '../../assets/icons';

interface CameraContentProps {
  takePhoto: () => void;
  close: () => void;
}

export const CameraContent: React.FC<CameraContentProps> = ({ takePhoto, close }) => {
  
  const handleTakePhoto = () => {
    takePhoto();
    // Optional: add a visual flash/feedback effect here
    close(); // Close window after taking photo
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 gap-6">
      <h3 className="text-2xl font-semibold">Camera</h3>
      <p className="text-white/80 text-center">Press the button below to capture the current view.</p>
      <button 
        onClick={handleTakePhoto} 
        className="w-24 h-24 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 border-4 border-white/50 transform active:scale-90"
        aria-label="Take Photo"
      >
        <div className="w-20 h-20 text-white">
          <CameraIcon />
        </div>
      </button>
    </div>
  );
};
