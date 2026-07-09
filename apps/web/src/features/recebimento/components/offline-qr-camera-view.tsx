'use client';

import { useEffect, useRef } from 'react';

import { BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import type { Result } from '@zxing/library';

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function releaseVideoElement(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.srcObject = null;
}

type OfflineQrCameraViewProps = {
  videoId: string;
  onResult: (result: Result | null, error: Error | null) => void;
};

export function OfflineQrCameraView({
  videoId,
  onResult,
}: OfflineQrCameraViewProps) {
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);

  onResultRef.current = onResult;

  useEffect(() => {
    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 500,
    });
    let cancelled = false;

    const release = () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      releaseVideoElement(
        document.getElementById(videoId) as HTMLVideoElement | null,
      );
    };

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoId,
        (result, error) => {
          if (cancelled) return;
          onResultRef.current(result ?? null, error ?? null);
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        const video = document.getElementById(
          videoId,
        ) as HTMLVideoElement | null;
        if (video?.srcObject instanceof MediaStream) {
          streamRef.current = video.srcObject;
        }
      })
      .catch((error: Error) => {
        if (!cancelled) onResultRef.current(null, error);
      });

    return () => {
      cancelled = true;
      release();
    };
  }, [videoId]);

  return (
    <video
      id={videoId}
      muted
      playsInline
      autoPlay
      className="absolute inset-0 block h-full w-full object-cover"
    />
  );
}
