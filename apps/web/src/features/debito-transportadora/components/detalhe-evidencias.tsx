'use client';

import { Button } from '@lilog/ui';
import { Camera, CloudUpload, Download, Eye, FileText } from 'lucide-react';

import { DetalheSection } from '@/features/debito-transportadora/components/detalhe-section';
import type { DebitoEvidencia } from '@/features/debito-transportadora/types/debito.schema';

type DetalheEvidenciasProps = {
  evidencias: DebitoEvidencia[];
  onUpload: () => void;
};

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return '';
  }

  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function DetalheEvidencias({
  evidencias,
  onUpload,
}: DetalheEvidenciasProps) {
  const imagens = evidencias.filter((ev) => ev.tipo === 'imagem');
  const documentos = evidencias.filter((ev) => ev.tipo === 'documento');

  return (
    <DetalheSection
      id="titulo-evidencias"
      title="Evidências"
      icon={Camera}
      badge={
        evidencias.length > 0 ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {evidencias.length}
          </span>
        ) : undefined
      }
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          onClick={onUpload}
        >
          <CloudUpload className="size-3" aria-hidden />
          Upload
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {imagens.map((ev) => (
          <div
            key={ev.id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-md bg-surface-highest"
          >
            {ev.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URLs externas de mock
              <img
                src={ev.url}
                alt={ev.nome}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="size-4 text-foreground" aria-hidden />
              <Download className="size-4 text-foreground" aria-hidden />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-outline-variant transition-colors hover:border-primary/40 hover:bg-surface-low"
          onClick={onUpload}
        >
          <Camera className="size-4 text-muted-foreground" aria-hidden />
          <span className="mt-1 text-[10px] text-muted-foreground">Foto</span>
        </button>

        <button
          type="button"
          className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-outline-variant transition-colors hover:border-primary/40 hover:bg-surface-low"
          onClick={onUpload}
        >
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <span className="mt-1 text-[10px] text-muted-foreground">Doc</span>
        </button>
      </div>

      {documentos.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-outline-variant/60 pt-3">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-md border border-outline-variant/60 bg-surface px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-destructive" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {doc.nome}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(doc.tamanhoBytes)}
                    {doc.dataUpload ? ` · ${doc.dataUpload}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 text-[10px] font-semibold text-primary hover:underline"
              >
                Ver
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </DetalheSection>
  );
}
