
import React, { useRef, useEffect, useState } from 'react';
import { useHandTracking } from '../../hooks/useHandTracking';

export const DrawingContent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FFFFFF');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth * 2; // High DPI
        canvas.height = canvas.offsetHeight * 2;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;
    }, []);
    
    useEffect(() => {
        if(contextRef.current) {
            contextRef.current.strokeStyle = color;
        }
    }, [color]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

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
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                className="w-full h-full bg-black/30 rounded-lg cursor-crosshair"
            />
        </div>
    );
};
