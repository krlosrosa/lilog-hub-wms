import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { AlertTriangle, Camera, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AvariaSelectField } from '@/features/recebimento/components/avaria-select-field';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { UppyCaptureModal } from '@/lib/uppy/uppy-capture-modal';
import { useUppyCapture } from '@/lib/uppy/use-uppy-capture';

import { useImpedimentoV2 } from '../hooks/use-impedimento-v2';
import { syncNowV2 } from '../services/auto-sync-v2.service';
import {
  TIPO_IMPEDIMENTO_OPTIONS,
  type ImpedimentoForm,
} from '../types/recebimento-v2.schema';

function impedimentoOwnerId(demandId: string) {
  return `impedimento-${demandId}`;
}

function PhotoThumb({
  title,
  photo,
  error,
  onCapture,
  onRemove,
}: {
  title: string;
  photo?: { id: string; previewUrl: string };
  error?: string;
  onCapture: () => void;
  onRemove: (photoId: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      {photo ? (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onCapture();
          }}
          className={cn(
            'h-16 w-16 overflow-hidden rounded-lg border bg-surface-container-low touch-manipulation active:scale-95',
            error ? 'border-destructive' : 'border-secondary',
          )}
          aria-label={`Trocar foto: ${title}`}
        >
          <img src={photo.previewUrl} alt={title} className="h-full w-full object-cover" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onCapture();
          }}
          className={cn(
            'flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed bg-surface-container-low px-1 touch-manipulation active:scale-95',
            error
              ? 'border-destructive text-destructive'
              : 'border-outline-variant text-on-surface-variant',
          )}
          aria-label={`Tirar foto: ${title}`}
        >
          <Camera className="h-5 w-5 shrink-0" aria-hidden />
        </button>
      )}
      {photo ? (
        <>
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
          </span>
          <button
            type="button"
            aria-label={`Remover foto: ${title}`}
            onClick={() => {
              hapticLight();
              void onRemove(photo.id);
            }}
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/75 text-background touch-manipulation active:scale-95"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      ) : null}
    </div>
  );
}

interface ImpedimentoV2SheetProps {
  demandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImpedimentoV2Sheet({
  demandId,
  open,
  onOpenChange,
  onSuccess,
}: ImpedimentoV2SheetProps) {
  const { registrarImpedimento } = useImpedimentoV2(demandId);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photoCapture = useUppyCapture({
    processId: demandId,
    ownerType: 'impedimento',
    ownerId: impedimentoOwnerId(demandId),
    maxNumberOfFiles: 1,
  });

  const tipoOptions = useMemo(
    () => TIPO_IMPEDIMENTO_OPTIONS.map((option) => ({
      value: option.id,
      label: option.label,
    })),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImpedimentoForm>({
    defaultValues: {
      tipo: '',
      descricao: '',
    },
  });

  async function onSubmit(form: ImpedimentoForm) {
    if (photoCapture.photos.length === 0) {
      setPhotoError('Foto obrigatória');
      toast.error('Informe uma foto do impedimento');
      return;
    }

    setPhotoError(null);

    try {
      hapticMedium();
      await registrarImpedimento({
        tipo: form.tipo,
        descricao: form.descricao,
        mediaIds: photoCapture.getPhotoIds(),
      });

      try {
        await syncNowV2(demandId, { manual: true });
        toast.success('Impedimento registrado e sincronizado');
      } catch {
        toast.success('Impedimento registrado. Sincronizará em instantes.');
        void syncNowV2(demandId, { manual: true });
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar impedimento');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
            <SheetTitle className="text-headline-md text-on-surface">
              Reportar impedimento
            </SheetTitle>
          </div>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Informe que não vai descarregar agora. A demanda volta para a lista e pode ser retomada
            depois, quando houver condições.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <AvariaSelectField
            id="tipo-impedimento"
            label="Tipo de impedimento"
            options={tipoOptions}
            placeholder="Selecione o motivo"
            error={errors.tipo?.message}
            {...register('tipo', { required: 'Selecione o tipo de impedimento' })}
          />

          <div className="space-y-1.5">
            <label className="text-label-sm font-medium text-on-surface" htmlFor="descricao-impedimento">
              Descrição <span className="text-destructive">*</span>
            </label>
            <textarea
              id="descricao-impedimento"
              {...register('descricao', {
                required: 'Descreva o impedimento',
                minLength: {
                  value: 10,
                  message: 'Use ao menos 10 caracteres',
                },
              })}
              rows={4}
              placeholder="Ex: Carreta tombada, sem condições de descarregar neste momento..."
              className={cn(
                'w-full resize-none rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none',
                'focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                errors.descricao ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.descricao ? (
              <p className="text-label-sm text-destructive">{errors.descricao.message}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface p-3">
            <p className="text-label-sm font-medium text-on-surface">
              Foto do impedimento <span className="text-destructive">*</span>
            </p>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Registre a situação do veículo ou da carga.
            </p>
            <div className="mt-3 flex items-start gap-3">
              <PhotoThumb
                title="Impedimento"
                photo={photoCapture.photos[0]}
                error={photoError ?? undefined}
                onCapture={() => photoCapture.capture()}
                onRemove={(id) => void photoCapture.removePhoto(id)}
              />
              <div className="min-w-0 flex-1">
                {photoError ? (
                  <p className="text-label-sm text-destructive">{photoError}</p>
                ) : photoCapture.captureError ? (
                  <p className="text-label-sm text-destructive">{photoCapture.captureError}</p>
                ) : (
                  <p className="text-label-sm text-on-surface-variant">
                    Toque para tirar ou substituir a foto.
                  </p>
                )}
              </div>
            </div>
            <UppyCaptureModal
              uppy={photoCapture.uppy}
              open={photoCapture.isModalOpen}
              onRequestClose={photoCapture.closeModal}
              onPickFromDevice={photoCapture.pickFromDevice}
              isProcessing={photoCapture.isProcessing}
              fileInputRef={photoCapture.fileInputRef}
              fileInputAccept={photoCapture.fileInputAccept}
              onNativeFileChange={photoCapture.handleNativeFileChange}
              note="Capture uma foto do impedimento. A imagem será salva localmente."
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || photoCapture.isProcessing}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-warning text-label-md font-semibold text-on-warning touch-manipulation transition-transform active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <AlertTriangle className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting ? 'Registrando...' : 'Confirmar e voltar para lista'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
