
import { useState, useEffect, RefObject, useCallback, useRef } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
  HandLandmarkerResult,
  NormalizedLandmark
} from '@mediapipe/tasks-vision';

export type Gesture = 'OPEN' | 'PINCH_DOWN' | 'PINCH_HELD' | 'PINCH_UP';

export interface HandData {
  id: number;
  gesture: Gesture;
  pinchDistance: number;
  cursorPosition: { x: number; y: number };
  landmarks: NormalizedLandmark[];
}

interface HandState {
    gesture: Gesture;
    smoothedPosition: { x: number; y: number };
}

let handLandmarker: HandLandmarker | undefined = undefined;
let lastVideoTime = -1;
let animationFrameId: number;

const PINCH_THRESHOLD = 0.04;
const RELEASE_THRESHOLD = 0.06;
const LERP_FACTOR = 0.3; // Smoothing factor

export const useHandTracking = (
  videoRef: RefObject<HTMLVideoElement>,
  onResults: (results: HandData[]) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prevHandState = useRef<Map<number, HandState>>(new Map());

  const processResults = (results: HandLandmarkerResult) => {
    const handsData: HandData[] = [];
    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const indexTip = landmarks[8] as NormalizedLandmark;
        const thumbTip = landmarks[4] as NormalizedLandmark;

        const distance = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) +
          Math.pow(indexTip.y - thumbTip.y, 2) +
          Math.pow((indexTip.z || 0) - (thumbTip.z || 0), 2)
        );
        
        const prevState = prevHandState.current.get(i) || { gesture: 'OPEN', smoothedPosition: { x: indexTip.x, y: indexTip.y } };

        // Cursor Smoothing (Lerp)
        const smoothedPosition = {
            x: prevState.smoothedPosition.x + (indexTip.x - prevState.smoothedPosition.x) * LERP_FACTOR,
            y: prevState.smoothedPosition.y + (indexTip.y - prevState.smoothedPosition.y) * LERP_FACTOR,
        };
        
        // Gesture State Machine with Hysteresis
        let newGesture: Gesture = prevState.gesture;
        const isCurrentlyPinched = distance < PINCH_THRESHOLD;
        const isCurrentlyReleased = distance > RELEASE_THRESHOLD;

        switch(prevState.gesture) {
            case 'OPEN':
                if (isCurrentlyPinched) newGesture = 'PINCH_DOWN';
                break;
            case 'PINCH_UP':
                if (isCurrentlyPinched) newGesture = 'PINCH_DOWN';
                else newGesture = 'OPEN';
                break;
            case 'PINCH_DOWN':
                if (isCurrentlyReleased) newGesture = 'PINCH_UP';
                else newGesture = 'PINCH_HELD';
                break;
            case 'PINCH_HELD':
                if (isCurrentlyReleased) newGesture = 'PINCH_UP';
                break;
        }

        const handData: HandData = {
          id: i,
          gesture: newGesture,
          pinchDistance: distance,
          cursorPosition: smoothedPosition,
          landmarks: landmarks,
        };
        handsData.push(handData);
        prevHandState.current.set(i, { gesture: newGesture, smoothedPosition });
      }
    }
    onResults(handsData);
  }

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    if (!video || !handLandmarker) {
      animationFrameId = requestAnimationFrame(predictWebcam);
      return;
    }

    if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
      lastVideoTime = video.currentTime;
      const results = handLandmarker.detectForVideo(video, Date.now());
      processResults(results);
    }
    animationFrameId = requestAnimationFrame(predictWebcam);
  }, [videoRef, onResults]);
  
  const createHandLandmarker = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing HandLandmarker:", err);
      let message = "Could not initialize the hand tracking model. This might be due to a network issue or an incompatible browser.";
      if (err instanceof Error) {
          message += ` Details: ${err.message}`;
      }
      setError(message);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    createHandLandmarker();
  }, [createHandLandmarker]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (video && !isLoading && !error) {
      const startPredictionLoop = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        predictWebcam();
      };

      const handleVideoLoaded = () => {
        startPredictionLoop();
      };
      
      if (video.readyState >= 2) {
        startPredictionLoop();
      } else {
        video.addEventListener("loadeddata", handleVideoLoaded);
      }
      
      return () => {
        video.removeEventListener("loadeddata", handleVideoLoaded);
      }
    }
  }, [isLoading, error, videoRef, predictWebcam]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameId);
    }
  }, [])

  return { isLoading, error };
};
