'use client';

import { Button } from '@lilog/ui';
import {
  Camera,
  CloudUpload,
  Download,
  Eye,
  FileText,
  Filter,
} from 'lucide-react';

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
    <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-headline-md font-medium text-foreground">
          <Camera className="size-5 text-primary" aria-hidden />
          Evidências Visuais
        </h3>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Filtrar">
            <Filter className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2 font-bold"
            onClick={onUpload}
          >
            <CloudUpload className="size-4" aria-hidden />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {imagens.map((ev) => (
          <div
            key={ev.id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-surface-highest"
          >
            {ev.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URLs externas de mock
              <img
                src={ev.url}
                alt={ev.nome}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="size-5 text-foreground" aria-hidden />
              <Download className="size-5 text-foreground" aria-hidden />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant transition-all hover:border-primary/50 hover:bg-surface-low"
          onClick={onUpload}
        >
          <Camera className="mb-2 size-6 text-muted-foreground" aria-hidden />
          <span className="text-caption text-muted-foreground">Adicionar Foto</span>
        </button>

        <button
          type="button"
          className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant transition-all hover:border-primary/50 hover:bg-surface-low"
          onClick={onUpload}
        >
          <FileText className="mb-2 size-6 text-muted-foreground" aria-hidden />
          <span className="text-caption text-muted-foreground">Anexar DOC</span>
        </button>
      </div>

      {documentos.length > 0 ? (
        <div className="mt-6 space-y-2">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-destructive" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {doc.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.tamanhoBytes)}
                    {doc.dataUpload ? ` • ${doc.dataUpload}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-primary hover:underline"
              >
                VISUALIZAR
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
