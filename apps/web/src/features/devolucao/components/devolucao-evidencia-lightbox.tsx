'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import type { Evidence } from '@/features/devolucao/types/devolucao-detalhes.schema';

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

type DevolucaoEvidenciaLightboxProps = {
  evidences: readonly Evidence[];
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
};

export function DevolucaoEvidenciaLightbox({
  evidences,
  selectedId,
  onSelectedIdChange,
}: DevolucaoEvidenciaLightboxProps) {
  const fotos = useMemo(
    () => evidences.filter((ev) => !ev.isPlaceholder && ev.url),
    [evidences],
  );

  const indiceAtual = selectedId
    ? fotos.findIndex((ev) => ev.id === selectedId)
    : -1;

  const aberto = indiceAtual >= 0;
  const fotoAtual = aberto ? fotos[indiceAtual] : null;
  const [zoom, setZoom] = useState(ZOOM_MIN);

  useEffect(() => {
    if (aberto) setZoom(ZOOM_MIN);
  }, [selectedId, aberto]);

  const irPara = useCallback(
    (offset: number) => {
      if (fotos.length === 0) return;
      const next =
        (indiceAtual + offset + fotos.length) % fotos.length;
      onSelectedIdChange(fotos[next]!.id);
    },
    [fotos, indiceAtual, onSelectedIdChange],
  );

  useEffect(() => {
    if (!aberto) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') irPara(-1);
      if (e.key === 'ArrowRight') irPara(1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aberto, irPara]);

  const aumentarZoom = () =>
    setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
  const diminuirZoom = () =>
    setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        if (!open) onSelectedIdChange(null);
      }}
    >
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-outline-variant px-6 py-4">
          <DialogTitle className="text-left text-headline-md">
            {fotoAtual?.alt ?? 'Evidência'}
          </DialogTitle>
          <DialogDescription className="text-left">
            {fotos.length > 1
              ? `Foto ${indiceAtual + 1} de ${fotos.length} • Use as setas para navegar`
              : 'Amplie a imagem com os controles de zoom'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex min-h-[50vh] flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
          {fotoAtual?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoAtual.url}
              alt={fotoAtual.alt}
              className="max-h-[70vh] max-w-full origin-center object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          )}

          {fotos.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                onClick={() => irPara(-1)}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-md"
                onClick={() => irPara(1)}
                aria-label="Próxima foto"
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-6 py-3">
          <span className="text-caption text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={diminuirZoom}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setZoom(ZOOM_MIN)}
              disabled={zoom === ZOOM_MIN}
            >
              Ajustar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={aumentarZoom}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function isEvidenciaComZoom(ev: Evidence): boolean {
  return !ev.isPlaceholder && Boolean(ev.url);
}
