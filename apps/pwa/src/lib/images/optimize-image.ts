import { logPhotoDebug } from '@/lib/images/photo-debug-log';

export type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

export type OptimizedImageResult = {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
};

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_QUALITY = 0.82;
const SKIP_OPTIMIZE_BELOW_BYTES = 280_000;

/** Preset for conference evidence photos (checklist, avaria, impedimento). */
export const CONFERENCE_PHOTO_OPTIONS: OptimizeImageOptions = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.75,
};

let webpExportSupported: boolean | null = null;

function supportsWebpExport(): boolean {
  if (webpExportSupported !== null) {
    return webpExportSupported;
  }

  if (typeof document === 'undefined') {
    webpExportSupported = false;
    return webpExportSupported;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpExportSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webpExportSupported;
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function loadImageSource(
  file: Blob,
): Promise<{ source: CanvasImageSource; cleanup: () => void; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch (error) {
      logPhotoDebug('optimize-createImageBitmap-fallback', {
        error: error instanceof Error ? error.message : String(error),
        blobSize: file.size,
        blobType: file.type,
      });
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => {},
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      logPhotoDebug('optimize-image-element-load-failed', {
        blobSize: file.size,
        blobType: file.type,
      });
      reject(new Error('Não foi possível carregar a imagem capturada'));
    };

    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/webp' | 'image/jpeg',
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao otimizar imagem'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Redimensiona e comprime imagens para upload offline (WebP quando suportado).
 * Reduz falhas de preview ("Load failed") em fotos grandes de câmera mobile.
 */
export async function optimizeImageForUpload(
  file: File | Blob,
  options?: OptimizeImageOptions,
): Promise<OptimizedImageResult> {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_EDGE;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_EDGE;
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const originalSize = file.size;

  logPhotoDebug('optimize-start', {
    originalSize,
    originalType: file.type,
    maxWidth,
    maxHeight,
    quality,
    webpSupported: supportsWebpExport(),
  });

  if (
    file.type === 'image/webp' &&
    originalSize <= SKIP_OPTIMIZE_BELOW_BYTES
  ) {
    const dimensions = await readImageDimensions(file);
    return {
      blob: file,
      mimeType: 'image/webp',
      width: dimensions.width,
      height: dimensions.height,
      originalSize,
      optimizedSize: originalSize,
    };
  }

  const loaded = await loadImageSource(file);
  const target = scaleDimensions(loaded.width, loaded.height, maxWidth, maxHeight);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas não disponível para otimizar imagem');
    }

    context.drawImage(loaded.source, 0, 0, target.width, target.height);

    const targetMime: 'image/webp' | 'image/jpeg' = supportsWebpExport()
      ? 'image/webp'
      : 'image/jpeg';

    let blob = await canvasToBlob(canvas, targetMime, quality);

    if (blob.size >= originalSize && originalSize > 0 && file.type.startsWith('image/')) {
      blob = file instanceof File ? file : new Blob([file], { type: file.type || 'image/jpeg' });
      return {
        blob,
        mimeType: blob.type || 'image/jpeg',
        width: loaded.width,
        height: loaded.height,
        originalSize,
        optimizedSize: blob.size,
      };
    }

    return {
      blob,
      mimeType: targetMime,
      width: target.width,
      height: target.height,
      originalSize,
      optimizedSize: blob.size,
    };
  } finally {
    loaded.cleanup();
  }
}

async function readImageDimensions(
  file: Blob,
): Promise<{ width: number; height: number }> {
  const loaded = await loadImageSource(file);
  try {
    return { width: loaded.width, height: loaded.height };
  } finally {
    loaded.cleanup();
  }
}
