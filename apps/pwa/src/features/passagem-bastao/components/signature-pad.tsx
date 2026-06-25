import { cn } from '@lilog/ui';
import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hapticLight } from '@/lib/haptics';

interface SignaturePadProps {
  onSignatureChange: (hasSignature: boolean) => void;
  className?: string;
}

export function SignaturePad({ onSignatureChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'hsl(var(--secondary))';
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getPoint = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      if ('touches' in event) {
        const touch = event.touches[0];
        if (!touch) return null;
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      drawingRef.current = true;
      const point = getPoint(event);
      const ctx = canvasRef.current?.getContext('2d');
      if (!point || !ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [getPoint],
  );

  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!drawingRef.current) return;
      event.preventDefault();

      const point = getPoint(event);
      const ctx = canvasRef.current?.getContext('2d');
      if (!point || !ctx) return;

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);

      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        setShowPlaceholder(false);
        onSignatureChange(true);
      }
    },
    [getPoint, onSignatureChange],
  );

  const stopDrawing = useCallback(() => {
    drawingRef.current = false;
    canvasRef.current?.getContext('2d')?.beginPath();
  }, []);

  const clear = useCallback(() => {
    hapticLight();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setShowPlaceholder(true);
    onSignatureChange(false);
  }, [onSignatureChange]);

  return (
    <div
      className={cn(
        'relative flex h-40 w-full cursor-crosshair items-center justify-center rounded-lg border-2 border-outline-variant bg-surface',
        className,
      )}
      style={{
        backgroundImage:
          'radial-gradient(hsl(var(--outline-variant)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {showPlaceholder ? (
        <span className="pointer-events-none select-none text-body-sm italic text-on-surface-variant/50">
          Assine aqui seu nome completo
        </span>
      ) : null}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        aria-label="Área de assinatura digital"
      />

      <button
        type="button"
        onClick={clear}
        aria-label="Limpar assinatura"
        className="absolute right-2 top-2 rounded-md bg-surface-container-lowest/80 p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low touch-manipulation active:scale-95"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
