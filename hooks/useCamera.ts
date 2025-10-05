
import { useState, useEffect, useCallback } from 'react';

type FacingMode = 'user' | 'environment';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  
  const getCamera = useCallback(async (mode: FacingMode) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }
      setError(null);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: mode, 
          width: 1280, 
          height: 720 
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check permissions and connection.";
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        message = "Camera access denied. Please enable camera permissions in your browser settings.";
      }
      setError(message);
    }
  }, [stream]);

  const toggleFacingMode = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
  };
  
  useEffect(() => {
    getCamera(facingMode);
    
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [facingMode]);

  return { videoStream: stream, cameraError: error, facingMode, toggleFacingMode };
};
