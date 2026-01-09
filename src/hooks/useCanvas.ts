import { useState, useCallback, useEffect, RefObject } from 'react';
import { CanvasState } from '@/types/note';

const STORAGE_KEY = 'whiteboard-canvas';
const MIN_SCALE = 0.25;
const MAX_SCALE = 2;

export function useCanvas(canvasRef: RefObject<HTMLDivElement>) {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Load canvas state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCanvasState(parsed);
      } catch {
        // Keep default state
      }
    }
  }, []);

  // Save canvas state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvasState));
  }, [canvasState]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, canvasState.scale * delta));
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Zoom towards mouse position
      const scaleChange = newScale - canvasState.scale;
      const offsetX = canvasState.offsetX - (mouseX - canvasState.offsetX) * (scaleChange / canvasState.scale);
      const offsetY = canvasState.offsetY - (mouseY - canvasState.offsetY) * (scaleChange / canvasState.scale);
      
      setCanvasState({
        scale: newScale,
        offsetX,
        offsetY,
      });
    }
  }, [canvasState, canvasRef]);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) { // Middle mouse button or space
      setIsPanning(true);
      e.preventDefault();
    }
  }, [isSpacePressed]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + e.movementX,
        offsetY: prev.offsetY + e.movementY,
      }));
    }
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setCanvasState({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    });
  }, []);

  // Handle keyboard events for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle wheel events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel, canvasRef]);

  return {
    canvasState,
    isPanning,
    isSpacePressed,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
  };
}
