
import { useState, useEffect, RefObject, useCallback, useRef } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
  HandLandmarkerResult,
  NormalizedLandmark
} from '@mediapipe/tasks-vision';

export type Gesture = 'OPEN' | 'TAP_DOWN' | 'TAP_HELD' | 'TAP_UP';
type MiddleIndexTapGesture = 'TAP_OPEN' | 'TAP_DOWN' | 'TAP_UP';

export interface HandData {
  id: number;
  gesture: Gesture;
  isPointing: boolean;
  pinchDistance: number;
  cursorPosition: { x: number; y: number };
  landmarks: NormalizedLandmark[];
  middleIndexDoubleTap: boolean;
}

interface HandState {
    gesture: Gesture;
    smoothedPosition: { x: number; y: number };
}

interface TapState {
    gesture: MiddleIndexTapGesture;
    lastTapTime: number;
    tapCount: number;
}

let handLandmarker: HandLandmarker | undefined = undefined;
let lastVideoTime = -1;
let animationFrameId: number;

const TAP_THRESHOLD = 0.04;
const RELEASE_THRESHOLD = 0.06;
const MIDDLE_INDEX_TAP_THRESHOLD = 0.05;
const MIDDLE_INDEX_RELEASE_THRESHOLD = 0.07;
const DOUBLE_TAP_WINDOW_MS = 400;

const LERP_FACTOR = 0.3; // Smoothing factor

export const useHandTracking = (
  videoRef: RefObject<HTMLVideoElement>,
  onResults: (results: HandData[]) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prevHandState = useRef<Map<number, HandState>>(new Map());
  const prevTapState = useRef<Map<number, TapState>>(new Map());

  const processResults = (results: HandLandmarkerResult) => {
    const handsData: HandData[] = [];
    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const indexTip = landmarks[8] as NormalizedLandmark;
        const thumbTip = landmarks[4] as NormalizedLandmark;
        const middleTip = landmarks[12] as NormalizedLandmark;

        // Pointing Gesture Detection
        const isIndexExtended = landmarks[8].y < landmarks[6].y;
        const isMiddleCurled = landmarks[12].y > landmarks[10].y;
        const isRingCurled = landmarks[16].y > landmarks[14].y;
        const isPinkyCurled = landmarks[20].y > landmarks[18].y;
        const isPointing = isIndexExtended && isMiddleCurled && isRingCurled && isPinkyCurled;

        // Tap (formerly Pinch) Gesture
        const distance = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) +
          Math.pow(indexTip.y - thumbTip.y, 2) +
          Math.pow((indexTip.z || 0) - (thumbTip.z || 0), 2)
        );
        
        const prevState = prevHandState.current.get(i) || { gesture: 'OPEN', smoothedPosition: { x: indexTip.x, y: indexTip.y } };
        const smoothedPosition = {
            x: prevState.smoothedPosition.x + (indexTip.x - prevState.smoothedPosition.x) * LERP_FACTOR,
            y: prevState.smoothedPosition.y + (indexTip.y - prevState.smoothedPosition.y) * LERP_FACTOR,
        };
        
        let newGesture: Gesture = prevState.gesture;
        const isCurrentlyTapped = distance < TAP_THRESHOLD;
        const isCurrentlyReleased = distance > RELEASE_THRESHOLD;

        switch(prevState.gesture) {
            case 'OPEN': if (isCurrentlyTapped) newGesture = 'TAP_DOWN'; break;
            case 'TAP_UP': if (isCurrentlyTapped) newGesture = 'TAP_DOWN'; else newGesture = 'OPEN'; break;
            case 'TAP_DOWN': if (isCurrentlyReleased) newGesture = 'TAP_UP'; else newGesture = 'TAP_HELD'; break;
            case 'TAP_HELD': if (isCurrentlyReleased) newGesture = 'TAP_UP'; break;
        }

        // Double Tap Gesture
        const tapDistance = Math.sqrt(
            Math.pow(indexTip.x - middleTip.x, 2) +
            Math.pow(indexTip.y - middleTip.y, 2) +
            Math.pow((indexTip.z || 0) - (middleTip.z || 0), 2)
        );
        let doubleTapEvent = false;
        const prevTState = prevTapState.current.get(i) || { gesture: 'TAP_OPEN', lastTapTime: 0, tapCount: 0 };
        let newTapGesture: MiddleIndexTapGesture = prevTState.gesture;
        const isCurrentlyDoubleTapped = tapDistance < MIDDLE_INDEX_TAP_THRESHOLD;
        const isCurrentlyTapReleased = tapDistance > MIDDLE_INDEX_RELEASE_THRESHOLD;

        switch(prevTState.gesture) {
            case 'TAP_OPEN': if(isCurrentlyDoubleTapped) newTapGesture = 'TAP_DOWN'; break;
            case 'TAP_UP': if(isCurrentlyDoubleTapped) newTapGesture = 'TAP_DOWN'; else newTapGesture = 'TAP_OPEN'; break;
            case 'TAP_DOWN': if(isCurrentlyTapReleased) newTapGesture = 'TAP_UP'; break;
        }

        let newTapCount = prevTState.tapCount;
        let newLastTapTime = prevTState.lastTapTime;

        if (newTapGesture === 'TAP_UP' && prevTState.gesture === 'TAP_DOWN') {
            const now = Date.now();
            if (now - prevTState.lastTapTime < DOUBLE_TAP_WINDOW_MS) {
                newTapCount++;
            } else {
                newTapCount = 1;
            }
            newLastTapTime = now;

            if (newTapCount >= 2) {
                doubleTapEvent = true;
                newTapCount = 0;
            }
        }
        
        if (Date.now() - newLastTapTime > DOUBLE_TAP_WINDOW_MS) {
            newTapCount = 0;
        }
        
        prevTapState.current.set(i, { gesture: newTapGesture, tapCount: newTapCount, lastTapTime: newLastTapTime });

        const handData: HandData = {
          id: i,
          gesture: newGesture,
          isPointing: isPointing,
          pinchDistance: distance,
          cursorPosition: smoothedPosition,
          landmarks: landmarks,
          middleIndexDoubleTap: doubleTapEvent,
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