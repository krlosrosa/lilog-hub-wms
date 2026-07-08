'use client';

import { useEffect, useState } from 'react';

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

import { listOperators } from '@/features/inventario/lib/inventario-api';
import type { ResponsavelGestorOption } from '@/features/inventario/types/inventario-cadastro.schema';
import type { DivergenciaItem } from '@/features/inventario/types/inventario-detalhe.schema';

type ModalSolicitarRecontagemDivergenciaProps = {
  open: boolean;
  divergencia: DivergenciaItem | null;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (payload: {
    responsavelId: number;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    motivo?: string;
  }) => void;
};

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
] as const;

export function ModalSolicitarRecontagemDivergencia({
  open,
  divergencia,
  processando,
  onOpenChange,
  onConfirm,
}: ModalSolicitarRecontagemDivergenciaProps) {
  const [responsavelId, setResponsavelId] = useState('');
  const [prioridade, setPrioridade] =
    useState<(typeof PRIORIDADES)[number]['value']>('alta');
  const [motivo, setMotivo] = useState('');
  const [operadores, setOperadores] = useState<ResponsavelGestorOption[]>([]);
  const [carregandoOperadores, setCarregandoOperadores] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCarregandoOperadores(true);
    void listOperators()
      .then((items) => setOperadores(items))
      .catch(() => setOperadores([]))
      .finally(() => setCarregandoOperadores(false));
  }, [open]);

  const handleOpenChange = (aberto: boolean) => {
    if (!aberto) {
      setResponsavelId('');
      setPrioridade('alta');
      setMotivo('');
    }
    onOpenChange(aberto);
  };

  const handleConfirm = () => {
    const parsedResponsavelId = Number(responsavelId);
    if (!Number.isInteger(parsedResponsavelId) || parsedResponsavelId <= 0) {
      return;
    }

    onConfirm({
      responsavelId: parsedResponsavelId,
      prioridade,
      motivo: motivo.trim() || undefined,
    });
    setResponsavelId('');
    setPrioridade('alta');
    setMotivo('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Solicitar recontagem</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Uma nova demanda de validação será criada para o operador
                selecionado revisar o endereço e o SKU desta divergência.
              </p>
              {divergencia ? (
                <p className="rounded-md border border-outline-variant bg-muted/30 px-3 py-2 text-xs text-foreground">
                  <span className="font-semibold">{divergencia.sku}</span>
                  {' · '}
                  {divergencia.produtoNome}
                  {divergencia.endereco ? (
                    <>
                      {' · '}
                      {divergencia.endereco}
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">
              Operador responsável
            </span>
            <select
              className={inputClass}
              value={responsavelId}
              disabled={carregandoOperadores || processando}
              onChange={(event) => setResponsavelId(event.target.value)}
            >
              <option value="">
                {carregandoOperadores
                  ? 'Carregando operadores...'
                  : 'Selecione o operador'}
              </option>
              {operadores.map((operador) => (
                <option key={operador.value} value={operador.value}>
                  {operador.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">
              Prioridade
            </span>
            <select
              className={inputClass}
              value={prioridade}
              disabled={processando}
              onChange={(event) =>
                setPrioridade(
                  event.target.value as (typeof PRIORIDADES)[number]['value'],
                )
              }
            >
              {PRIORIDADES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">
              Observações (opcional)
            </span>
            <textarea
              className={cn(inputClass, 'min-h-20 resize-y')}
              placeholder="Instruções adicionais para o operador"
              value={motivo}
              disabled={processando}
              onChange={(event) => setMotivo(event.target.value)}
            />
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={processando || !responsavelId}
            onClick={handleConfirm}
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Solicitando…
              </>
            ) : (
              'Solicitar recontagem'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
