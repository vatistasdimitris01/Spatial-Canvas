import { useState, useEffect, useCallback } from 'react';

type FacingMode = 'user' | 'environment';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const [zoom, setZoom] = useState<number>(1);
  
  const getCamera = useCallback(async (mode: FacingMode, currentZoom: number) => {
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
      
      // Apply zoom if supported
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      // @ts-ignore
      if (capabilities.zoom) {
        // @ts-ignore
        const minZoom = capabilities.zoom.min;
        // @ts-ignore
        const maxZoom = capabilities.zoom.max;
        const targetZoom = currentZoom === 1 ? maxZoom : minZoom;
        // FIX: Add @ts-ignore to allow using the non-standard 'zoom' property.
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ zoom: targetZoom }] });
      }

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
  
  const toggleZoom = () => {
    const newZoom = zoom === 1 ? 0.5 : 1;
    setZoom(newZoom);
  };

  useEffect(() => {
    getCamera(facingMode, zoom);
    
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [facingMode, zoom]);

  return { videoStream: stream, cameraError: error, facingMode, toggleFacingMode, zoom, toggleZoom };
};
