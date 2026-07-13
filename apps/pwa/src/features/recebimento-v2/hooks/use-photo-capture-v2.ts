import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { optimizeImageForUpload } from '@/lib/images/optimize-image';

import { recebimentoV2Db } from '../local-db/db';
import type { MediaRecord } from '../local-db/schema';
import { captureMedia } from '../services/media.service';

export interface CapturedPhotoV2 {
  id: string;
  previewUrl: string;
  mimeType: string;
  createdAt: string;
}

export interface UsePhotoCaptureV2Options {
  processId: string;
  ownerType: MediaRecord['ownerType'];
  ownerId: string;
}

export function usePhotoCaptureV2({
  processId,
  ownerType,
  ownerId,
}: UsePhotoCaptureV2Options) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const rawPhotos = useLiveQuery(
    () =>
      recebimentoV2Db.media
        .where('ownerId')
        .equals(ownerId)
        .and((m) => m.ownerType === ownerType && m.status !== 'error')
        .toArray(),
    [ownerId, ownerType],
  );

  const photos: CapturedPhotoV2[] =
    rawPhotos?.map((photo) => {
      let previewUrl = previewUrlsRef.current.get(photo.id);
      if (!previewUrl && photo.blob) {
        previewUrl = URL.createObjectURL(photo.blob);
        previewUrlsRef.current.set(photo.id, previewUrl);
      }
      return {
        id: photo.id,
        previewUrl: previewUrl ?? '',
        mimeType: photo.mimeType,
        createdAt: photo.createdAt,
      };
    }).filter((p) => p.previewUrl) ?? [];

  useEffect(() => {
    const currentIds = new Set(photos.map((p) => p.id));
    for (const [id, url] of previewUrlsRef.current.entries()) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(id);
      }
    }
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  const capture = useCallback(() => {
    setCaptureError(null);
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      setCaptureError(null);
      setIsProcessing(true);

      try {
        const optimized = await optimizeImageForUpload(file);
        await captureMedia(
          processId,
          ownerType,
          ownerId,
          optimized.blob,
          optimized.mimeType,
          optimized.filename,
        );
      } catch (error) {
        setCaptureError(
          error instanceof Error ? error.message : 'Falha ao capturar foto',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [ownerId, ownerType, processId],
  );

  const removePhoto = useCallback(async (photoId: string) => {
    await recebimentoV2Db.media.delete(photoId);
  }, []);

  const getPhotoIds = useCallback((): string[] => photos.map((p) => p.id), [photos]);

  return {
    photos,
    capture,
    removePhoto,
    getPhotoIds,
    inputRef,
    handleFileChange,
    captureError,
    isProcessing,
  };
}
