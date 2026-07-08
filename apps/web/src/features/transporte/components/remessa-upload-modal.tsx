'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { CloudUpload, Loader2 } from 'lucide-react';

const inputClassName = cn(
  'mt-1 w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
);

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv';

export type RemessaUploadConfirmPayload = {
  arquivo: File;
  dataReferencia: string;
  horarioExpectativaSaida: string;
};

type RemessaUploadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processando: boolean;
  onConfirmar: (payload: RemessaUploadConfirmPayload) => void;
};

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatLocalDate(date)}T${hours}:${minutes}`;
}

function criarDefaultsUpload() {
  const hoje = new Date();
  const proximoDiaUtil = new Date(hoje);
  proximoDiaUtil.setDate(proximoDiaUtil.getDate() + 1);

  while (proximoDiaUtil.getDay() === 0 || proximoDiaUtil.getDay() === 6) {
    proximoDiaUtil.setDate(proximoDiaUtil.getDate() + 1);
  }

  proximoDiaUtil.setHours(7, 0, 0, 0);

  return {
    dataReferencia: formatLocalDate(hoje),
    horarioExpectativaSaida: formatLocalDateTime(proximoDiaUtil),
  };
}

export function RemessaUploadModal({
  open,
  onOpenChange,
  processando,
  onConfirmar,
}: RemessaUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dataReferencia, setDataReferencia] = useState(
    () => criarDefaultsUpload().dataReferencia,
  );
  const [horarioExpectativaSaida, setHorarioExpectativaSaida] = useState(
    () => criarDefaultsUpload().horarioExpectativaSaida,
  );
  const [dragAtivo, setDragAtivo] = useState(false);

  useEffect(() => {
    if (!open) {
      setArquivo(null);
      setDragAtivo(false);
      return;
    }

    const defaults = criarDefaultsUpload();
    setDataReferencia(defaults.dataReferencia);
    setHorarioExpectativaSaida(defaults.horarioExpectativaSaida);
  }, [open]);

  const podeConfirmar =
    arquivo !== null &&
    dataReferencia.length > 0 &&
    horarioExpectativaSaida.length > 0;

  const selecionarArquivo = useCallback((file: File | null) => {
    if (!file) {
      return;
    }

    const nome = file.name.toLowerCase();
    const valido =
      nome.endsWith('.xlsx') ||
      nome.endsWith('.xls') ||
      nome.endsWith('.csv');

    if (!valido) {
      return;
    }

    setArquivo(file);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragAtivo(false);
      selecionarArquivo(event.dataTransfer.files?.[0] ?? null);
    },
    [selecionarArquivo],
  );

  const handleConfirmar = useCallback(() => {
    if (!arquivo || !podeConfirmar) {
      return;
    }

    onConfirmar({
      arquivo,
      dataReferencia,
      horarioExpectativaSaida,
    });
  }, [
    arquivo,
    dataReferencia,
    horarioExpectativaSaida,
    onConfirmar,
    podeConfirmar,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CloudUpload className="size-5 text-primary" aria-hidden />
            Upload de Remessas
          </DialogTitle>
          <DialogDescription>
            Importe remessas via CSV ou XLS para agrupar automaticamente por
            transporte.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(event) =>
            selecionarArquivo(event.target.files?.[0] ?? null)
          }
        />

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragAtivo(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragAtivo(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragAtivo(false);
          }}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all',
            dragAtivo
              ? 'border-primary bg-primary/10'
              : 'border-outline-variant hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <CloudUpload
            className="size-12 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-4 text-sm font-medium text-foreground">
            Arraste e solte o arquivo aqui
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            CSV ou XLS — máx. 10MB
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 rounded-full"
            onClick={() => inputRef.current?.click()}
          >
            Selecionar arquivo
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="upload-data-referencia"
              className="text-xs text-muted-foreground"
            >
              Data de referência
            </label>
            <input
              id="upload-data-referencia"
              type="date"
              required
              value={dataReferencia}
              onChange={(event) => setDataReferencia(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label
              htmlFor="upload-horario-expectativa-saida"
              className="text-xs text-muted-foreground"
            >
              Horário expectativa saída
            </label>
            <input
              id="upload-horario-expectativa-saida"
              type="datetime-local"
              required
              value={horarioExpectativaSaida}
              onChange={(event) =>
                setHorarioExpectativaSaida(event.target.value)
              }
              className={inputClassName}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Informe data e hora completas da saída prevista.
            </p>
          </div>
        </div>

        {arquivo && (
          <div className="space-y-2 rounded-lg bg-surface-low p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Arquivo selecionado
            </p>
            <div className="flex justify-between text-sm">
              <span className="truncate pr-3">{arquivo.name}</span>
              <span className="font-mono text-muted-foreground">
                {formatarTamanhoArquivo(arquivo.size)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={processando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={processando || !podeConfirmar}
            onClick={handleConfirmar}
            className="gap-2"
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Processando…
              </>
            ) : (
              'Confirmar Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
