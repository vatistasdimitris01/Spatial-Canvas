
# Spatial Canvas: An Immersive Web Experience

## 1. Overview

Spatial Canvas is an advanced, browser-based mixed reality application that showcases the future of web interfaces. It creates a spatial computing environment where users can interact with a 3D user interface using natural hand gestures. The application seamlessly blends digital content with the physical world through your device's camera, offering distinct modes for Augmented Reality (AR), Mixed Reality (MR), and Virtual Reality (VR).

The project is built entirely on modern web technologies, demonstrating the power of JavaScript libraries like React, Google's MediaPipe for computer vision, and the Google Gemini API for real-time AI features.

---

## 2. Core Features

*   **Real-Time Hand Tracking:** Utilizes the device's camera to render a full 3D skeletal model of the user's hands, tracking each joint's position in real-time.
*   **Gesture-Based Interaction:** The primary interaction method is a "pinch" gesture between the thumb and index finger, which functions like a mouse click for selecting, dragging, and interacting with UI elements.
*   **Spatial UI:** All UI elements, including app icons and windows, exist in a 3D space. The app grid is arranged in an arc, and windows float in front of the user, creating a true sense of depth.
*   **AR, MR, and VR Modes:**
    *   **AR:** UI elements are highly transparent for a minimal, overlay-style experience.
    *   **MR (Default):** A beautiful glass-like effect (backdrop-blur) is used to blend the UI with the real world.
    *   **VR:** UI is more opaque, and a stereoscopic view is enabled for use with mobile VR headsets, providing a fully immersive experience.
*   **Head Tracking:** Leverages the device's gyroscope and accelerometer to adjust the UI's perspective as the user moves their head, enhancing immersion.
*   **AI-Powered Apps (Gemini API):**
    *   **Live Transcriber:** Captures microphone audio and provides a real-time text transcription.
    *   **Live Translator:** Transcribes English speech and translates it into Spanish in real-time.
*   **Progressive Web App (PWA):** The application is fully installable on mobile devices, can run full-screen without the browser's address bar, and has basic offline capabilities.

---

## 3. Technologies & Libraries

*   **Frontend Framework:** **React** is used for building the component-based user interface.
*   **Hand Tracking:** **Google MediaPipe (`@mediapipe/tasks-vision`)** is the core engine for our hand tracking. It processes the video stream from the camera and provides detailed landmark data for up to two hands.
*   **AI & Machine Learning:** **Google Gemini API (`@google/genai`)** powers the transcriber and translator apps. Specifically, it uses the `live.connect` method for low-latency, real-time audio streaming and processing.
*   **Styling:** **TailwindCSS** is used for rapid, utility-first styling of the UI components.
*   **Immersive Web APIs:** The `DeviceOrientationEvent` API is used for head tracking, and the Service Worker API is used for PWA functionality.

---

## 4. Code Snippets & Explanations

### a. Hand Tracking & Gesture Recognition

The core of the interaction logic lies in the `useHandTracking.ts` hook. We initialize MediaPipe's `HandLandmarker` and then run a prediction loop on the video feed.

**Snippet from `hooks/useHandTracking.ts`:**
```typescript
// ... (initialization code)

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
  // ... other data
};
```
This snippet shows the simple but effective state machine that determines the current gesture. Using two different thresholds (`PINCH_THRESHOLD` and `RELEASE_THRESHOLD`) creates hysteresis, which prevents the gesture from rapidly flickering between "pinched" and "open" states, leading to a much smoother user experience.

### b. Gemini Live API for Real-Time Transcription

The `Transcriber.tsx` component demonstrates how to connect to the Gemini API's real-time endpoint. We set up a session and stream processed microphone audio directly to the model.

**Snippet from `components/content/Transcriber.tsx`:**
```typescript
// ... (setup code)

setStatus('Connecting to AI...');
sessionPromiseRef.current = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
        onopen: () => {
            setStatus('Listening... (speak into your microphone)');
            // ... (connect microphone to script processor)
        },
        onmessage: (message: LiveServerMessage) => {
            const text = message.serverContent?.inputTranscription?.text;
            if (text) {
                setTranscription(prev => prev + text);
            }
        },
        onerror: (e: ErrorEvent) => { /* ... */ },
        onclose: () => { /* ... */ },
    },
    config: {
        inputAudioTranscription: {},
        responseModalities: [Modality.AUDIO],
    },
});

scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    const pcmBlob = createBlob(inputData);
    // Send the audio blob after the session is established
    sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
    });
};
```
This code establishes a persistent connection to Gemini. The `onaudioprocess` event fires continuously, sending small chunks of audio. The `onmessage` callback receives transcriptions from the server as they are processed, allowing for a live, low-latency display of spoken words.

### c. 3D Hand Rendering with SVG

To create the immersive feeling of seeing your own hands, we render the landmark data from MediaPipe using SVG. We use the `z` coordinate to simulate depth by scaling the joints and connection lines.

**Snippet from `components/HandCursor.tsx`:**
```typescript
// ... (inside the HandSkeleton component)

const landmarkPoints = landmarks.map(lm => ({
    x: (1 - lm.x) * window.innerWidth,
    y: lm.y * window.innerHeight,
    z: lm.z,
}));

// ... later in the render method for a line between two joints:
const avgZ = ((start.z || 0) + (end.z || 0)) / 2;
const strokeWidth = Math.max(1, BASE_STROKE_WIDTH * (1 - avgZ * Z_SCALE_FACTOR));

// ... and for a joint (circle):
const radius = Math.max(1, BASE_RADIUS * (1 - (lm.z || 0) * Z_SCALE_FACTOR));

return (
  <svg>
    {/* ... map and render lines and circles with dynamic strokeWidth and radius ... */}
  </svg>
);
```
This demonstrates how simple 2D rendering tools like SVG can be used to create a compelling 3D effect. As parts of the hand move closer to the camera (`z` decreases), their corresponding SVG elements are drawn larger, providing realistic depth perception.
