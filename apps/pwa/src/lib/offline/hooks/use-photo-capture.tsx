import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useRef, type ChangeEvent } from 'react';

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
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await savePhoto(db, {
        relatedId,
        blob: file,
        mimeType: file.type || 'image/jpeg',
      });

      event.target.value = '';
    },
    [relatedId]
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
    isLoading: rawPhotos === undefined,
  };
}
