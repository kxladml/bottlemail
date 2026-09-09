'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Edit3, Eraser } from 'lucide-react';

interface DrawingCanvasProps {
  onDrawingChange: (dataUri: string | null) => void;
  isDarkPaper?: boolean;
}

export default function DrawingCanvas({ onDrawingChange, isDarkPaper = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(2.5);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>(isDarkPaper ? '#f4f4f5' : '#111111');
  const [history, setHistory] = useState<ImageData[]>([]);

  // Update stroke color when paper changes from dark to light or vice versa
  useEffect(() => {
    if (isDarkPaper) {
      setStrokeColor('#f4f4f5');
    } else {
      setStrokeColor('#111111');
    }
  }, [isDarkPaper]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial blank state
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
  }, []);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), currentData]); // Keep last 15 states
    onDrawingChange(canvas.toDataURL('image/png'));
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = brushSize;
    }

    // Draw single dot on click
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistoryState();
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousState = newHistory[newHistory.length - 1];

    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);

    if (newHistory.length <= 1) {
      onDrawingChange(null);
    } else {
      onDrawingChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const blankData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([blankData]);
    onDrawingChange(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Basic Toolbar */}
      <div className="w-full bg-white border border-black p-2 mb-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`px-2 py-1 border border-black flex items-center gap-1 font-bold ${
              !isEraser ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            <Edit3 size={12} /> Pen
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`px-2 py-1 border border-black flex items-center gap-1 font-bold ${
              isEraser ? 'bg-black text-white' : 'bg-white text-black'
            }`}
          >
            <Eraser size={12} /> Eraser
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-gray-600">Size:</span>
          {[
            { label: 'Fine', size: 1.5 },
            { label: 'Med', size: 3 },
            { label: 'Thick', size: 6 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setBrushSize(item.size)}
              className={`px-2 py-1 border border-black text-[11px] ${
                brushSize === item.size ? 'bg-black text-white font-bold' : 'bg-white text-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Ink Colors (if not dark paper) */}
        {!isDarkPaper && !isEraser && (
          <div className="flex items-center gap-1">
            <span className="font-mono text-gray-600">Ink:</span>
            {[
              { label: 'Black', color: '#111111' },
              { label: 'Fountain Navy', color: '#1e3a8a' },
              { label: 'Pencil', color: '#555555' },
            ].map((ink) => (
              <button
                key={ink.label}
                type="button"
                onClick={() => setStrokeColor(ink.color)}
                style={{ backgroundColor: ink.color }}
                className={`w-5 h-5 rounded-none border border-black ${
                  strokeColor === ink.color ? 'ring-2 ring-black ring-offset-1' : ''
                }`}
                title={ink.label}
              />
            ))}
          </div>
        )}

        {/* Undo & Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={history.length <= 1}
            className="px-2 py-1 border border-black bg-white text-black disabled:opacity-30 flex items-center gap-1 font-bold"
            title="Undo stroke"
          >
            <RotateCcw size={12} /> Undo
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-2 py-1 border border-black bg-white text-black hover:bg-red-50 flex items-center gap-1 font-bold"
            title="Clear canvas"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Canvas Drawing Surface */}
      <div className="w-full relative h-[320px] cursor-crosshair border border-dashed border-gray-400">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block touch-none"
        />
        {history.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs font-mono">
            [ Draw your letter or sketch here using mouse / touch ]
          </div>
        )}
      </div>
    </div>
  );
}
