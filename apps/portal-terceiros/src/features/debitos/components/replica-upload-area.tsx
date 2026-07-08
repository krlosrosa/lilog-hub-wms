'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';

import { cn } from '@lilog/ui';

type ArquivoItem = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

type ReplicaUploadAreaProps = {
  arquivos: ArquivoItem[];
  onAdicionar: (files: FileList | File[]) => void;
  onRemover: (id: string) => void;
  disabled?: boolean;
};

function formatTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReplicaUploadArea({
  arquivos,
  onAdicionar,
  onRemover,
  disabled = false,
}: ReplicaUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled && event.dataTransfer.files.length > 0) {
            onAdicionar(event.dataTransfer.files);
          }
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className="mb-2 size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Arraste arquivos ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF ou imagens — máx. 5 arquivos, 10 MB cada
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files?.length) {
              onAdicionar(event.target.files);
              event.target.value = '';
            }
          }}
        />
      </div>

      {arquivos.length > 0 ? (
        <ul className="space-y-2">
          {arquivos.map((arquivo) => (
            <li
              key={arquivo.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{arquivo.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTamanho(arquivo.file.size)}
                  {arquivo.status === 'uploading' ? ' — enviando…' : null}
                  {arquivo.status === 'done' ? ' — enviado' : null}
                  {arquivo.status === 'error' ? ` — ${arquivo.error}` : null}
                </p>
              </div>
              {arquivo.status === 'uploading' ? (
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
              ) : (
                <button
                  type="button"
                  onClick={() => onRemover(arquivo.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remover ${arquivo.file.name}`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
