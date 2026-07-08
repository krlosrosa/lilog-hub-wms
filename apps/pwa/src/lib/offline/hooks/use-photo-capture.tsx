import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { optimizeImageForUpload } from '@/lib/images/optimize-image';
import {
  logPhotoBlobSummary,
  logPhotoDebug,
  inspectStoredPhoto,
} from '@/lib/images/photo-debug-log';

import { db } from '../db';
import {
  createObjectUrl,
  deletePhoto,
  getPhotosByRelated,
  savePhoto,
} from '../photo-store';

export interface CapturedPhoto {
  id: number;
  previewUrl: string;
  mimeType: string;
  createdAt: number;
}

export interface UsePhotoCaptureOptions {
  relatedId: string;
}

export function usePhotoCapture({ relatedId }: UsePhotoCaptureOptions) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlsRef = useRef<Map<number, string>>(new Map());
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const rawPhotos = useLiveQuery(
    () => getPhotosByRelated(db, relatedId),
    [relatedId]
  );

  const photos: CapturedPhoto[] =
    rawPhotos?.map((photo) => {
      let previewUrl = previewUrlsRef.current.get(photo.id!);
      if (!previewUrl) {
        previewUrl = createObjectUrl(photo);
        previewUrlsRef.current.set(photo.id!, previewUrl);
        logPhotoDebug('preview-object-url-created', {
          relatedId,
          photoId: photo.id,
          previewUrlPrefix: previewUrl.slice(0, 32),
          mimeType: photo.mimeType,
          blobType: photo.blob.type,
          blobSize: photo.blob.size,
        });
      }
      return {
        id: photo.id!,
        previewUrl,
        mimeType: photo.mimeType,
        createdAt: photo.createdAt,
      };
    }) ?? [];

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

      if (!file) {
        return;
      }

      setCaptureError(null);
      setIsProcessing(true);

      logPhotoDebug('capture-file-selected', {
        relatedId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
      });

      try {
        const optimized = await optimizeImageForUpload(file);

        logPhotoBlobSummary('capture-optimized', optimized.blob, optimized.mimeType, {
          relatedId,
          width: optimized.width,
          height: optimized.height,
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
          compressionRatio:
            optimized.originalSize > 0
              ? Number((optimized.optimizedSize / optimized.originalSize).toFixed(3))
              : null,
        });

        const photoId = await savePhoto(db, {
          relatedId,
          blob: optimized.blob,
          mimeType: optimized.mimeType,
        });

        const stored = await inspectStoredPhoto(photoId);
        logPhotoDebug('capture-saved-to-indexeddb', {
          relatedId,
          photoId,
          stored,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao processar a imagem. Tente outra foto.';
        logPhotoDebug(
          'capture-failed',
          {
            relatedId,
            error: message,
            stack: error instanceof Error ? error.stack : undefined,
          },
          `Erro ao processar foto: ${message}`,
        );
        setCaptureError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [relatedId],
  );

  const remove = useCallback(async (photoId: number) => {
    const url = previewUrlsRef.current.get(photoId);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(photoId);
    }
    await deletePhoto(db, photoId);
  }, []);

  const getPhotoIds = useCallback(() => photos.map((p) => p.id), [photos]);

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handleFileChange}
      aria-hidden
    />
  );

  return {
    photos,
    capture,
    remove,
    getPhotoIds,
    hiddenInput,
    captureError,
    isProcessing,
    isLoading: rawPhotos === undefined,
  };
}
