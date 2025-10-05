import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import React, { useState, useEffect, useRef } from 'react';

// Audio Encoding Helper
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Blob creation for audio data
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const Transcriber: React.FC = () => {
    const [status, setStatus] = useState('Initializing');
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string | null>(null);
    // FIX: The `LiveSession` type is not exported from the '@google/genai' package.
    // Use `any` for the session promise type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let scriptProcessor: ScriptProcessorNode | null = null;
        let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
        let mediaStream: MediaStream | null = null;

        const startTranscription = async () => {
            try {
                // FIX: Use process.env.API_KEY as per the coding guidelines. The key is assumed to be pre-configured.
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

                setStatus('Requesting microphone access...');
                mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // FIX: Cast window to `any` to access vendor-prefixed `webkitAudioContext` without a type error.
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

                setStatus('Connecting to AI...');
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setStatus('Listening... (speak into your microphone)');
                            mediaStreamSource = audioContext!.createMediaStreamSource(mediaStream!);
                            mediaStreamSource.connect(scriptProcessor!);
                            scriptProcessor!.connect(audioContext!.destination);
                        },
                        onmessage: (message: LiveServerMessage) => {
                            const text = message.serverContent?.inputTranscription?.text;
                            if (text) {
                                setTranscription(prev => prev + text);
                            }
                            if (message.serverContent?.turnComplete) {
                                setTranscription(prev => prev + ' ');
                            }
                            // FIX: Per Gemini API guidelines, audio output must be handled even if not used.
                            const base64EncodedAudioString =
                                message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                            if (base64EncodedAudioString) {
                                // Audio data is received but not played back in this transcriber component.
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            console.error('Live API Error:', e);
                            setError(`Connection error: ${e.message}`);
                            setStatus('Error');
                        },
                        onclose: () => {
                            setStatus('Connection closed');
                        },
                    },
                    config: {
                        inputAudioTranscription: {},
                        // FIX: responseModalities must be an array with a single `Modality.AUDIO` element.
                        responseModalities: [Modality.AUDIO],
                    },
                });
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(`Failed to start: ${message}`);
                setStatus('Error');
            }
        };

        startTranscription();

        return () => {
            sessionPromiseRef.current?.then(session => session.close());
            mediaStream?.getTracks().forEach(track => track.stop());
            scriptProcessor?.disconnect();
            mediaStreamSource?.disconnect();
            audioContext?.close();
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white p-6">
            <h3 className="text-xl font-semibold mb-4">Live Transcriber</h3>
            <div className="w-full h-12 bg-black/30 rounded-lg flex items-center justify-center mb-4">
                <p className="text-lg font-medium text-white/80">{status}</p>
            </div>
            <div className="w-full flex-grow bg-black/30 rounded-lg p-4 overflow-y-auto">
                <p className="text-lg whitespace-pre-wrap">{transcription}</p>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    );
};