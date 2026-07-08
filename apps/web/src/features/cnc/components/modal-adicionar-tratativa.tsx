'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { AdicionarTratativaBody } from '@/features/cnc/lib/cnc-api';
import type {
  CncDetalhe,
  CncResponsavel,
  CncTratativaTipo,
} from '@/features/cnc/types/cnc.schema';
import {
  CNC_RESPONSAVEL_LABELS,
  CNC_TRATATIVA_TIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';

type ModalAdicionarTratativaProps = {
  open: boolean;
  cnc: CncDetalhe;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (body: AdicionarTratativaBody) => void;
};

const TIPO_OPTIONS = Object.entries(CNC_TRATATIVA_TIPO_LABELS) as [
  CncTratativaTipo,
  string,
][];

const RESPONSAVEL_OPTIONS = Object.entries(CNC_RESPONSAVEL_LABELS) as [
  CncResponsavel,
  string,
][];

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function ModalAdicionarTratativa({
  open,
  cnc,
  processando,
  onOpenChange,
  onConfirm,
}: ModalAdicionarTratativaProps) {
  const [tipo, setTipo] = useState<CncTratativaTipo>('imediata');
  const [descricao, setDescricao] = useState('');
  const [responsavelTipo, setResponsavelTipo] = useState<CncResponsavel>(
    cnc.responsavel,
  );
  const [prazo, setPrazo] = useState('');

  const handleConfirm = () => {
    if (!descricao.trim()) {
      return;
    }

    onConfirm({
      tipo,
      descricao: descricao.trim(),
      responsavelTipo,
      prazo: prazo ? new Date(prazo).toISOString() : null,
    });
  };

  const handleOpenChange = (aberto: boolean) => {
    if (!aberto) {
      setTipo('imediata');
      setDescricao('');
      setResponsavelTipo(cnc.responsavel);
      setPrazo('');
    }

    onOpenChange(aberto);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Adicionar tratativa
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-muted-foreground">
              Registre uma nova tratativa para a CNC{' '}
              <span className="font-semibold text-foreground">{cnc.numero}</span>
              .
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="tratativa-tipo"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Tipo
            </label>
            <select
              id="tratativa-tipo"
              value={tipo}
              onChange={(event) =>
                setTipo(event.target.value as CncTratativaTipo)
              }
              className={inputClass}
            >
              {TIPO_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tratativa-descricao"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Descrição <span className="text-destructive">*</span>
            </label>
            <textarea
              id="tratativa-descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Descreva a tratativa..."
            />
          </div>

          <div>
            <label
              htmlFor="tratativa-responsavel"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Responsável
            </label>
            <select
              id="tratativa-responsavel"
              value={responsavelTipo}
              onChange={(event) =>
                setResponsavelTipo(event.target.value as CncResponsavel)
              }
              className={inputClass}
            >
              {RESPONSAVEL_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tratativa-prazo"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Prazo (opcional)
            </label>
            <input
              id="tratativa-prazo"
              type="datetime-local"
              value={prazo}
              onChange={(event) => setPrazo(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={processando || !descricao.trim()}
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Adicionar tratativa
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
