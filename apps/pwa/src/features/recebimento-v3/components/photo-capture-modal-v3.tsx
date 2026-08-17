import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lilog/ui';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';

import type { PhotoCaptureV3Api } from '../hooks/use-photo-capture-v3';

interface PhotoCaptureModalV3Props {
  capture: PhotoCaptureV3Api;
  note?: string;
}

export function PhotoCaptureModalV3({
  capture: {
    isModalOpen,
    closeModal,
    isProcessing,
    fileInputRef,
    cameraInputRef,
    fileInputAccept,
    takePhoto,
    pickFromDevice,
    handleNativeFileChange,
    handleCameraFileChange,
  },
  note = 'Tire uma foto ou selecione da galeria. A imagem será salva localmente.',
}: PhotoCaptureModalV3Props) {
  return (
    <>
      <HiddenFileInput
        inputRef={cameraInputRef}
        accept={fileInputAccept}
        capture="environment"
        onChange={handleCameraFileChange}
      />
      <HiddenFileInput
        inputRef={fileInputRef}
        accept={fileInputAccept}
        onChange={handleNativeFileChange}
      />

      <Sheet open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Capturar foto</SheetTitle>
            <SheetDescription>{note}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <Button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-2"
              disabled={isProcessing}
              onClick={takePhoto}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Tirar foto
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex h-12 w-full items-center justify-center gap-2"
              disabled={isProcessing}
              onClick={pickFromDevice}
            >
              <ImagePlus className="h-4 w-4" />
              Selecionar da galeria
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function HiddenFileInput({
  inputRef,
  accept,
  capture,
  onChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  accept: string;
  capture?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      capture={capture}
      className="hidden"
      onChange={onChange}
    />
  );
}
