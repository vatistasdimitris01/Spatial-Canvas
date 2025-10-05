import React, { useRef, useEffect, useState } from 'react';
import { HandData } from '../../hooks/useHandTracking';

interface DrawingContentProps {
    hands?: HandData[];
    windowRef?: React.RefObject<HTMLDivElement>;
}

export const DrawingContent: React.FC<DrawingContentProps> = ({ hands = [], windowRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [color, setColor] = useState('#FFFFFF');
    const drawingStates = useRef<Map<number, boolean>>(new Map());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.scale(dpr, dpr);
            context.lineCap = 'round';
            context.strokeStyle = color;
            context.lineWidth = 5;
            contextRef.current = context;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);
    
    useEffect(() => {
        if(contextRef.current) {
            contextRef.current.strokeStyle = color;
        }
    }, [color]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        const windowEl = windowRef?.current;
        if (!canvas || !context || !windowEl) return;

        const rect = canvas.getBoundingClientRect();

        hands.forEach(hand => {
            const cursorX = (1 - hand.cursorPosition.x) * window.innerWidth;
            const cursorY = hand.cursorPosition.y * window.innerHeight;
            
            const isOverCanvas = cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom;

            if (isOverCanvas) {
                const canvasX = cursorX - rect.left;
                const canvasY = cursorY - rect.top;

                // FIX: Replaced deprecated 'PINCH_DOWN' gesture with 'TAP_DOWN' to match Gesture type.
                if (hand.gesture === 'TAP_DOWN') {
                    context.beginPath();
                    context.moveTo(canvasX, canvasY);
                    drawingStates.current.set(hand.id, true);
                // FIX: Replaced deprecated 'PINCH_HELD' gesture with 'TAP_HELD' to match Gesture type.
                } else if (hand.gesture === 'TAP_HELD' && drawingStates.current.get(hand.id)) {
                    context.lineTo(canvasX, canvasY);
                    context.stroke();
                // FIX: Replaced deprecated 'PINCH_UP' gesture with 'TAP_UP' to match Gesture type.
                } else if (hand.gesture === 'TAP_UP' || hand.gesture === 'OPEN') {
                    if(drawingStates.current.get(hand.id)) {
                        context.closePath();
                        drawingStates.current.set(hand.id, false);
                    }
                }
            } else {
                 if(drawingStates.current.get(hand.id)) {
                    context.closePath();
                    drawingStates.current.set(hand.id, false);
                }
            }
        });

    }, [hands, windowRef, color]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if(canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    const colors = ['#FFFFFF', '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#EC4899'];

    return (
        <div className="w-full h-full flex flex-col text-white p-2 gap-2">
            <div className="flex-shrink-0 flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    {colors.map(c => (
                        <button key={c} onClick={() => setColor(c)}
                            className="w-8 h-8 rounded-full transition-transform duration-150 hover:scale-110"
                            style={{ backgroundColor: c, border: color === c ? '3px solid #9ca3af' : '3px solid transparent' }}
                            aria-label={`Set color to ${c}`}
                        />
                    ))}
                </div>
                <button onClick={clearCanvas} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">Clear</button>
            </div>
             <canvas
                ref={canvasRef}
                className="w-full h-full bg-black/30 rounded-lg"
            />
        </div>
    );
};