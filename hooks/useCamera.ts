
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
      
      let deviceId: string | undefined = undefined;
      // Opportunistically check for a wide-angle camera.
      // Note: Device labels are only available *after* permission has been granted.
      // This may not find the wide camera on the very first load.
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        const searchTerms = ['ultra wide', '0.5x', 'wide'];
        const facingModeTerm = mode === 'user' ? 'front' : 'back';

        // Find a device that matches the facing mode and includes a wide-angle keyword.
        const targetDevice = videoDevices.find(d => {
            const label = d.label.toLowerCase();
            return label.includes(facingModeTerm) && searchTerms.some(term => label.includes(term));
        });

        if (targetDevice) {
            console.log(`Found wide-angle camera: ${targetDevice.label}`);
            deviceId = targetDevice.deviceId;
        }
      }

      const constraints: MediaStreamConstraints = {
        video: { 
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: mode }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera. Please check permissions and connection.";
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        message = "Camera access denied. Please enable camera permissions in your browser settings.";
      } else if (err instanceof Error && err.name === 'OverconstrainedError') {
          message = "The ideal camera resolution is not supported by your device. Trying default settings.";
          // Fallback to default constraints if 1920x1080 is not supported
          const fallbackConstraints: MediaStreamConstraints = { video: { facingMode: mode }};
          try {
              const newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
              setStream(newStream);
              setError(null); // Clear previous error
              return;
          } catch (fallbackErr) {
               message = "Could not access the camera with any settings. Please check permissions and connection.";
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  return { videoStream: stream, cameraError: error, facingMode, toggleFacingMode };
};