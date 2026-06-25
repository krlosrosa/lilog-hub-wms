import { Camera } from 'lucide-react';

import type { CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

import { PhotoGalleryStrip } from './photo-gallery-strip';

interface ChecklistExtrasSectionProps {
  observacoesAdicionais: string;
  onObservacoesChange: (value: string) => void;
  photos: CapturedPhoto[];
  onCapturePhoto: () => void;
  onRemovePhoto: (photoId: number) => void;
  hiddenInput: React.ReactNode;
}

export function ChecklistExtrasSection({
  observacoesAdicionais,
  onObservacoesChange,
  photos,
  onCapturePhoto,
  onRemovePhoto,
  hiddenInput,
}: ChecklistExtrasSectionProps) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Camera className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md font-semibold text-on-surface">
            Observações e fotos adicionais
          </h2>
          <p className="text-label-sm text-on-surface-variant">Opcional · turno geral</p>
        </div>
      </div>

      <textarea
        id="obs-adicionais-turno"
        value={observacoesAdicionais}
        onChange={(event) => onObservacoesChange(event.target.value)}
        placeholder="Registre observações gerais do turno, pendências ou alertas para o próximo operador..."
        rows={3}
        aria-label="Observações adicionais do turno"
        className="w-full resize-none rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary"
      />

      <PhotoGalleryStrip
        photos={photos}
        onCapture={onCapturePhoto}
        onRemove={onRemovePhoto}
        hiddenInput={hiddenInput}
        label="Fotos adicionais"
        className="mt-3"
      />
    </section>
  );
}
