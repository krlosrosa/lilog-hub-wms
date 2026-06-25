import { Loader2, ScanLine, X } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import type { Result } from '@zxing/library';



import { hapticError, hapticMedium } from '@/lib/haptics';



import { QrCameraView } from './qr-camera-view';

import { releaseVideoElement } from './stop-media-stream';



const VIDEO_ID = 'kls-qr-scanner-video';



export interface QrScannerModalProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  title: string;

  onScan: (value: string) => void;

}



function getResultText(result: Result): string {

  return result.getText();

}



export function QrScannerModal({

  open,

  onOpenChange,

  title,

  onScan,

}: QrScannerModalProps) {

  const lastScanRef = useRef('');

  const [cameraError, setCameraError] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);



  useEffect(() => {

    if (!open) {

      setCameraActive(false);

      setCameraError(null);

      return;

    }



    const timer = window.setTimeout(() => setCameraActive(true), 150);

    return () => window.clearTimeout(timer);

  }, [open]);



  const stopCamera = useCallback(() => {

    setCameraActive(false);

    releaseVideoElement(

      document.getElementById(VIDEO_ID) as HTMLVideoElement | null

    );

  }, []);



  const handleClose = useCallback(() => {

    stopCamera();

    lastScanRef.current = '';

    setCameraError(null);

    onOpenChange(false);

  }, [onOpenChange, stopCamera]);



  const handleResult = useCallback(

    (result: Result | null, error: Error | null) => {

      if (error) {

        const name = error.name;

        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {

          setCameraError(

            'Permissão de câmera negada. Habilite nas configurações do navegador.'

          );

          hapticError();

        }

        return;

      }



      if (!result) return;



      const text = getResultText(result).trim();

      if (!text || text === lastScanRef.current) return;



      lastScanRef.current = text;

      hapticMedium();

      onScan(text);

      handleClose();

    },

    [handleClose, onScan]

  );



  if (!open || typeof document === 'undefined') return null;



  return createPortal(

    <div

      className="fixed inset-0 z-[100] flex flex-col bg-background"

      role="dialog"

      aria-modal="true"

      aria-label={title}

    >

      <div className="flex shrink-0 items-center justify-between border-b border-outline-variant px-4 py-3">

        <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>

        <button

          type="button"

          onClick={handleClose}

          aria-label="Fechar scanner"

          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"

        >

          <X className="h-5 w-5" />

        </button>

      </div>



      <div className="relative min-h-0 flex-1 bg-black">

        {cameraError ? (

          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-body-sm text-destructive">

            {cameraError}

          </p>

        ) : cameraActive ? (

          <>

            <QrCameraView videoId={VIDEO_ID} onResult={handleResult} />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

              <div className="flex h-56 w-56 items-center justify-center rounded-lg border-2 border-white/70">

                <div className="h-0.5 w-full animate-pulse bg-error" />

              </div>

            </div>

          </>

        ) : (

          <div className="flex h-full items-center justify-center">

            <Loader2 className="h-8 w-8 animate-spin text-secondary" />

          </div>

        )}

      </div>



      <p className="flex shrink-0 items-center justify-center gap-2 border-t border-outline-variant p-4 text-label-sm text-on-surface-variant">

        <ScanLine className="h-4 w-4" aria-hidden />

        Aponte para o código QR

      </p>

    </div>,

    document.body

  );

}


