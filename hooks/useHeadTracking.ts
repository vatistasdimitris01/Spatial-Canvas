
import { useState, useEffect, useCallback } from 'react';

// Clamp function to limit a value between a min and max
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useHeadTracking = () => {
  const [worldTransform, setWorldTransform] = useState<string>('');
  const [initialOrientation, setInitialOrientation] = useState<{ alpha: number | null }>({ alpha: null });
  const [isTracking, setIsTracking] = useState(false);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.alpha === null || event.beta === null || event.gamma === null) {
      return;
    }

    if (initialOrientation.alpha === null) {
        setInitialOrientation({ alpha: event.alpha });
    }

    const calibratedAlpha = initialOrientation.alpha !== null ? event.alpha - initialOrientation.alpha : 0;
    
    // We primarily use alpha (yaw) for horizontal rotation.
    // Beta (pitch) can be used for vertical rotation but can be sensitive.
    // Gamma (roll) is usually not desired for UI rotation.
    const rotateY = -calibratedAlpha; // Negate for natural movement
    const rotateX = clamp(event.beta - 90, -45, 45); // Clamp vertical rotation to avoid extremes

    setWorldTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  }, [initialOrientation.alpha]);
  
  const requestPermission = useCallback(() => {
    // For iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            setIsTracking(true);
          }
        })
        .catch(console.error);
    } else {
      // Handle non-iOS 13+ devices
      window.addEventListener('deviceorientation', handleOrientation);
      setIsTracking(true);
    }
  }, [handleOrientation]);
  
  // Attempt to start tracking on mount
  useEffect(() => {
    requestPermission();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      setIsTracking(false);
    };
  }, [requestPermission, handleOrientation]);

  const recenter = useCallback(() => {
    // This will cause the current orientation to be captured as the new "zero"
    setInitialOrientation({ alpha: null });
  }, []);

  return { worldTransform, recenter, isTracking };
};
