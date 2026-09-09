'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Edit3, Eraser } from 'lucide-react';

interface DrawingCanvasProps {
  onDrawingChange: (dataUri: string | null) => void;
  isDarkPaper?: boolean;
}

export default function DrawingCanvas({ onDrawingChange, isDarkPaper = false }: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(2.5);
  const [isEraser, setIsEraser] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>(isDarkPaper ? '#f4f4f5' : '#111111');
  const [hasContent, setHasContent] = useState(false);
  const [history, setHistory] = useState<string[]>([]); // Data URIs for reliable history

  // Update stroke color when paper changes between dark and light
  useEffect(() => {
    if (isDarkPaper) {
      setStrokeColor('#f4f4f5');
    } else {
      setStrokeColor('#111111');
    }
  }, [isDarkPaper]);

  // Canvas setup with DPI awareness
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || 560, 280);
    const height = 320;
    const dpr = window.devicePixelRatio || 1;

    // Check if we need to resize
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      // Save current content before resizing
      const tempImage = canvas.toDataURL();

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore if there was drawing
      if (hasContent && tempImage) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = tempImage;
      }
    }
  }, [hasContent]);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore in environments where pointer capture is unsupported
    }

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

    // Dot on single tap
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUri = canvas.toDataURL('image/png');
    setHistory((prev) => [...prev.slice(-15), dataUri]);
    setHasContent(true);
    onDrawingChange(dataUri);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Pop current state

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (newHistory.length === 0) {
      setHistory([]);
      setHasContent(false);
      onDrawingChange(null);
    } else {
      const prevUri = newHistory[newHistory.length - 1];
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale for direct pixel copy
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };
      img.src = prevUri;
      setHistory(newHistory);
      onDrawingChange(prevUri);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHasContent(false);
    onDrawingChange(null);
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* Retro Canvas Toolbar */}
      <div className="w-full bg-white border border-black p-2 mb-2 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`px-2.5 py-1 border border-black flex items-center gap-1 font-bold ${
              !isEraser ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Edit3 size={12} /> Pen
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`px-2.5 py-1 border border-black flex items-center gap-1 font-bold ${
              isEraser ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Eraser size={12} /> Eraser
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-1 font-mono">
          <span className="text-gray-600 text-[11px]">Size:</span>
          {[
            { label: 'Fine', size: 1.5 },
            { label: 'Med', size: 3.5 },
            { label: 'Thick', size: 7 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setBrushSize(item.size)}
              className={`px-2 py-0.5 border border-black text-[11px] ${
                brushSize === item.size ? 'bg-black text-white font-bold' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Ink Palette */}
        {!isDarkPaper && !isEraser && (
          <div className="flex items-center gap-1 font-mono">
            <span className="text-gray-600 text-[11px]">Ink:</span>
            {[
              { label: 'Black', color: '#111111' },
              { label: 'Fountain Navy', color: '#1e3a8a' },
              { label: 'Graphite', color: '#555555' },
            ].map((ink) => (
              <button
                key={ink.label}
                type="button"
                onClick={() => setStrokeColor(ink.color)}
                style={{ backgroundColor: ink.color }}
                className={`w-5 h-5 border border-black ${
                  strokeColor === ink.color ? 'ring-2 ring-black ring-offset-1 scale-110' : 'opacity-85'
                }`}
                title={ink.label}
              />
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-2 py-1 border border-black bg-white text-black disabled:opacity-30 flex items-center gap-1 font-bold hover:bg-gray-100"
            title="Undo stroke"
          >
            <RotateCcw size={12} /> Undo
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasContent}
            className="px-2 py-1 border border-black bg-white text-black disabled:opacity-30 hover:bg-red-50 flex items-center gap-1 font-bold"
            title="Clear canvas"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Surface */}
      <div className="w-full relative h-[320px] cursor-crosshair border border-dashed border-gray-400 bg-transparent overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block touch-none"
          style={{ touchAction: 'none' }}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs font-mono select-none">
            [ Draw your letter or sketch here using mouse / touch / stylus ]
          </div>
        )}
      </div>
    </div>
  );
}
