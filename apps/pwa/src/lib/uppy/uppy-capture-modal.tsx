import DashboardModal from '@uppy/react/dashboard-modal';
import type Uppy from '@uppy/core';
import type { Body, Meta } from '@uppy/utils';
import { type ChangeEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';
import '@uppy/webcam/css/style.min.css';

interface UppyCaptureModalProps {
  uppy: Uppy<Meta, Body>;
  open: boolean;
  onRequestClose: () => void;
  onPickFromDevice?: () => void;
  isProcessing?: boolean;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  fileInputAccept?: string;
  onNativeFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  note?: string;
}

export function UppyCaptureModal({
  uppy,
  open,
  onRequestClose,
  onPickFromDevice,
  isProcessing = false,
  fileInputRef,
  fileInputAccept = 'image/*,.jpg,.jpeg,.png,.webp,.heic,.heif',
  onNativeFileChange,
  note = 'Use a câmera ou selecione um arquivo. A imagem será salva localmente.',
}: UppyCaptureModalProps) {
  const pickFromDeviceButton =
    open && onPickFromDevice
      ? createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10000001] flex justify-center px-4 pb-safe-offset-6">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onPickFromDevice}
              className="pointer-events-auto max-w-md rounded-full bg-secondary px-5 py-3 text-label-md font-semibold text-on-secondary shadow-lg touch-manipulation disabled:opacity-60"
            >
              Selecionar arquivo do dispositivo
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {fileInputRef && onNativeFileChange ? (
        <input
          ref={fileInputRef}
          type="file"
          accept={fileInputAccept}
          className="hidden"
          onChange={onNativeFileChange}
        />
      ) : null}
      <DashboardModal
        uppy={uppy}
        open={open}
        onRequestClose={onRequestClose}
        closeModalOnClickOutside
        proudlyDisplayPoweredByUppy={false}
        hideUploadButton
        disableStatusBar
        doneButtonHandler={null}
        plugins={['Webcam']}
        autoOpen="Webcam"
        note={note}
        locale={{
          strings: {
            dropPasteFiles: 'Use a câmera ou o botão abaixo para escolher um arquivo',
            browseFiles: 'Selecionar arquivo',
            myDevice: 'Meu dispositivo',
          },
        }}
      />
      {pickFromDeviceButton}
    </>
  );
}
