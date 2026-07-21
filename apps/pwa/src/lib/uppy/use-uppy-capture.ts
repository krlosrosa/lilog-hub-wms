import { useLiveQuery } from 'dexie-react-hooks';

import Uppy from '@uppy/core';

import Webcam from '@uppy/webcam';

import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

  type ChangeEvent,

} from 'react';

import { toast } from 'sonner';



import { captureMedia } from '@/features/recebimento-v2/services/media.service';

import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';

import type { MediaRecord } from '@/features/recebimento-v2/local-db/schema';

import { CONFERENCE_PHOTO_OPTIONS, optimizeImageForUpload } from '@/lib/images/optimize-image';



export interface CapturedPhotoV2 {

  id: string;

  previewUrl: string;

  mimeType: string;

  createdAt: string;

}



export interface UseUppyCaptureOptions {

  processId: string;

  ownerType: MediaRecord['ownerType'];

  ownerId: string;

  maxNumberOfFiles?: number;

  onCapture?: (mediaId: string) => void;

}



const IMAGE_FILE_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.heic,.heif';



export function useUppyCapture({

  processId,

  ownerType,

  ownerId,

  maxNumberOfFiles,

  onCapture,

}: UseUppyCaptureOptions) {

  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [captureError, setCaptureError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCaptureRef = useRef(onCapture);



  useEffect(() => {

    onCaptureRef.current = onCapture;

  }, [onCapture]);



  const uppy = useMemo(() => {

    const instance = new Uppy({

      autoProceed: false,

      restrictions: {

        maxNumberOfFiles: maxNumberOfFiles ?? null,

        allowedFileTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],

      },

    });



    instance.use(Webcam, {

      id: 'Webcam',

      modes: ['picture'],

      mirror: true,

      showVideoSourceDropdown: true,

      mobileNativeCamera:

        typeof navigator !== 'undefined' &&

        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),

    });



    return instance;

  }, [maxNumberOfFiles]);



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

            : new File(

                [sourceFile],

                filename ?? 'photo.jpg',

                { type: sourceFile.type || 'image/jpeg' },

              );



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



  useEffect(() => {

    const handleFileAdded = async (file: { id: string; data?: Blob | File }) => {

      if (!file.data) {

        uppy.removeFile(file.id);

        return;

      }



      try {

        await processSelectedFile(

          file.data,

          file.data instanceof File ? file.data.name : `${file.id}.jpg`,

        );

      } catch {

        // toast already shown in processSelectedFile

      } finally {

        uppy.removeFile(file.id);

      }

    };



    const handleRestrictionFailed = (_file: unknown, error: Error) => {

      const message = error.message || 'Arquivo não permitido';

      setCaptureError(message);

      toast.error(message);

    };



    uppy.on('file-added', handleFileAdded);

    uppy.on('restriction-failed', handleRestrictionFailed);



    return () => {

      uppy.off('file-added', handleFileAdded);

      uppy.off('restriction-failed', handleRestrictionFailed);

    };

  }, [processSelectedFile, uppy]);



  useEffect(() => {

    return () => {

      uppy.destroy();

    };

  }, [uppy]);



  useEffect(() => {

    const webcam = uppy.getPlugin('Webcam') as

      | {

          takeSnapshot: () => Promise<void>;

          submit: () => void;

          capturedMediaFile: unknown;

        }

      | undefined;



    if (!webcam) {

      return;

    }



    const originalTakeSnapshot = webcam.takeSnapshot.bind(webcam);

    webcam.takeSnapshot = async () => {

      await originalTakeSnapshot();

      if (webcam.capturedMediaFile) {

        webcam.submit();

      }

    };



    return () => {

      webcam.takeSnapshot = originalTakeSnapshot;

    };

  }, [uppy]);



  const rawPhotos = useLiveQuery(

    () =>

      recebimentoV2Db.media

        .where('ownerId')

        .equals(ownerId)

        .and((m) => m.ownerType === ownerType && m.status !== 'uploaded' && m.status !== 'error')

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

    setIsModalOpen(true);

  }, []);



  const pickFromDevice = useCallback(() => {

    if (isProcessing) return;

    setCaptureError(null);

    fileInputRef.current?.click();

  }, [isProcessing]);



  const handleNativeFileChange = useCallback(

    async (event: ChangeEvent<HTMLInputElement>) => {

      const file = event.target.files?.[0];

      event.target.value = '';

      if (!file) return;



      try {

        await processSelectedFile(file, file.name);

      } catch {

        // toast already shown in processSelectedFile

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

    uppy,

    fileInputRef,

    fileInputAccept: IMAGE_FILE_ACCEPT,

    handleNativeFileChange,

  };

}


