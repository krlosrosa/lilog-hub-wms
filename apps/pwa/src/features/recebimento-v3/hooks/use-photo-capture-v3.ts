import { useLiveQuery } from 'dexie-react-hooks';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';
import { toast } from 'sonner';

import { captureMedia } from '@/features/recebimento-v2/services/media.service';
import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import type { MediaRecord } from '@/features/recebimento-v2/local-db/schema';
import { CONFERENCE_PHOTO_OPTIONS, optimizeImageForUpload } from '@/lib/images/optimize-image';

export interface CapturedPhotoV3 {
  id: string;
  previewUrl: string;
  mimeType: string;
  createdAt: string;
}

export interface UsePhotoCaptureV3Options {
  processId: string;
  ownerType: MediaRecord['ownerType'];
  ownerId: string;
  maxNumberOfFiles?: number;
  onCapture?: (mediaId: string) => void;
}

export interface PhotoCaptureV3Api {
  photos: CapturedPhotoV3[];
  capture: () => void;
  pickFromDevice: () => void;
  closeModal: () => void;
  removePhoto: (photoId: string) => Promise<void>;
  getPhotoIds: () => string[];
  captureError: string | null;
  isProcessing: boolean;
  isModalOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  fileInputAccept: string;
  takePhoto: () => void;
  handleNativeFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleCameraFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const IMAGE_FILE_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.heic,.heif';

export function usePhotoCaptureV3({
  processId,
  ownerType,
  ownerId,
  maxNumberOfFiles,
  onCapture,
}: UsePhotoCaptureV3Options): PhotoCaptureV3Api {
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const processSelectedFile = useCallback(
    async (sourceFile: File | Blob, filename?: string) => {
      setCaptureError(null);
      setIsProcessing(true);

      try {
        await ensureRecebimentoV2DbReady();

        if (maxNumberOfFiles === 1) {
          const existingPhotos = await recebimentoV2Db.media
            .where('ownerId')
            .equals(ownerId)
            .and(
              (media) =>
                media.ownerType === ownerType &&
                media.status !== 'uploaded' &&
                media.status !== 'error',
            )
            .toArray();

          if (existingPhotos.length > 0) {
            await recebimentoV2Db.media.bulkDelete(existingPhotos.map((media) => media.id));
          }
        }

        const normalizedFile =
          sourceFile instanceof File
            ? sourceFile
            : new File([sourceFile], filename ?? 'photo.jpg', {
                type: sourceFile.type || 'image/jpeg',
              });

        const optimized = await optimizeImageForUpload(normalizedFile, CONFERENCE_PHOTO_OPTIONS);
        const mediaId = await captureMedia(
          processId,
          ownerType,
          ownerId,
          optimized.blob,
          optimized.mimeType,
          optimized.filename,
        );

        onCaptureRef.current?.(mediaId);
        setIsModalOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao capturar foto';
        setCaptureError(message);
        toast.error(message);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [maxNumberOfFiles, ownerId, ownerType, processId],
  );

  const rawPhotos = useLiveQuery(
    () =>
      recebimentoV2Db.media
        .where('ownerId')
        .equals(ownerId)
        .and((m) => m.ownerType === ownerType && m.status !== 'uploaded' && m.status !== 'error')
        .toArray(),
    [ownerId, ownerType],
  );

  const photos: CapturedPhotoV3[] =
    rawPhotos
      ?.map((photo) => {
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
      })
      .filter((p) => p.previewUrl) ?? [];

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
    setIsModalOpen(true);
  }, []);

  const pickFromDevice = useCallback(() => {
    if (isProcessing) return;
    setCaptureError(null);
    fileInputRef.current?.click();
  }, [isProcessing]);

  const takePhoto = useCallback(() => {
    if (isProcessing) return;
    setCaptureError(null);
    cameraInputRef.current?.click();
  }, [isProcessing]);

  const handleNativeFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        await processSelectedFile(file, file.name);
      } catch {
        // toast already shown
      }
    },
    [processSelectedFile],
  );

  const handleCameraFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        await processSelectedFile(file, file.name);
      } catch {
        // toast already shown
      }
    },
    [processSelectedFile],
  );

  const closeModal = useCallback(() => {
    if (isProcessing) return;
    setIsModalOpen(false);
  }, [isProcessing]);

  const removePhoto = useCallback(async (photoId: string) => {
    await recebimentoV2Db.media.delete(photoId);
  }, []);

  const getPhotoIds = useCallback((): string[] => photos.map((p) => p.id), [photos]);

  return {
    photos,
    capture,
    pickFromDevice,
    closeModal,
    removePhoto,
    getPhotoIds,
    captureError,
    isProcessing,
    isModalOpen,
    fileInputRef,
    cameraInputRef,
    fileInputAccept: IMAGE_FILE_ACCEPT,
    takePhoto,
    handleNativeFileChange,
    handleCameraFileChange,
  };
}
