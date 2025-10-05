import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Chat } from '@google/genai';
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


export const Translator: React.FC = () => {
    const [status, setStatus] = useState('Initializing');
    const [transcription, setTranscription] = useState('');
    const [translation, setTranslation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const textToTranslate = useRef('');

    useEffect(() => {
        let audioContext: AudioContext | null = null;
        let scriptProcessor: ScriptProcessorNode | null = null;
        let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
        let mediaStream: MediaStream | null = null;

        const startTranslation = async () => {
            try {
                if (!process.env.API_KEY) {
                    throw new Error("API_KEY is not set.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: 'You are a live translator. Translate the given English text to Spanish. Respond only with the translation, nothing else.',
                        thinkingConfig: { thinkingBudget: 0 }
                    },
                });

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
                            setStatus('Listening... (speak in English)');
                            mediaStreamSource = audioContext!.createMediaStreamSource(mediaStream!);
                            mediaStreamSource.connect(scriptProcessor!);
                            scriptProcessor!.connect(audioContext!.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            const text = message.serverContent?.inputTranscription?.text;
                            if (text) {
                                setTranscription(prev => prev + text);
                                textToTranslate.current += text;
                            }
                            if (message.serverContent?.turnComplete) {
                                setTranscription(prev => prev + ' ');
                                
                                if (textToTranslate.current.trim().length > 0) {
                                    const textChunk = textToTranslate.current;
                                    textToTranslate.current = '';
                                    
                                    const result = await chatRef.current?.sendMessageStream({ message: textChunk });
                                    if (result) {
                                        let fullResponse = '';
                                        for await (const chunk of result) {
                                            fullResponse += chunk.text;
                                            setTranslation(prev => prev + chunk.text);
                                        }
                                        setTranslation(prev => prev + ' ');
                                    }
                                }
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
                        responseModalities: [],
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

        startTranslation();

        return () => {
            sessionPromiseRef.current?.then(session => session.close());
            mediaStream?.getTracks().forEach(track => track.stop());
            scriptProcessor?.disconnect();
            mediaStreamSource?.disconnect();
            audioContext?.close();
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col text-white p-4 gap-4">
            <h3 className="text-xl font-semibold text-center">Live Translator (EN to ES)</h3>
            <div className="w-full h-12 bg-black/30 rounded-lg flex items-center justify-center">
                <p className="text-lg font-medium text-white/80">{status}</p>
            </div>
            <div className="w-full flex-grow flex flex-col gap-4">
                <div className="flex-1 bg-black/30 rounded-lg p-3 overflow-y-auto">
                    <p className="text-sm font-bold mb-2 text-white/70">English (Live Transcription)</p>
                    <p className="text-lg whitespace-pre-wrap">{transcription}</p>
                </div>
                <div className="flex-1 bg-black/30 rounded-lg p-3 overflow-y-auto">
                    <p className="text-sm font-bold mb-2 text-white/70">Spanish (Live Translation)</p>
                    <p className="text-lg whitespace-pre-wrap">{translation}</p>
                </div>
            </div>
            {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
        </div>
    );
};
