'use client';

import { useEffect, useState } from 'react';

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

import {
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/enderecos/components/form-field-classes';
import {
  ENDERECO_STATUS_LABELS,
  type EnderecoStatus,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export type EnderecoDialogState =
  | { type: 'block'; enderecoId: string; enderecoLabel: string }
  | {
      type: 'unblock';
      enderecoId: string;
      enderecoLabel: string;
      ocupacaoPercent: number;
    }
  | {
      type: 'change-status';
      enderecoId: string;
      enderecoLabel: string;
      currentStatus: EnderecoStatus;
    }
  | { type: 'mass-block'; count: number }
  | null;

const ALL_STATUSES: EnderecoStatus[] = [
  'disponivel',
  'ocupado',
  'bloqueado',
  'inventario',
  'inativo',
];

type EnderecoActionDialogsProps = {
  dialogState: EnderecoDialogState;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmBlock: (motivo: string) => void;
  onConfirmUnblock: (motivo?: string) => void;
  onConfirmChangeStatus: (status: EnderecoStatus, motivo?: string) => void;
  onConfirmMassBlock: (motivo: string) => void;
};

function MotivoTextarea({
  id,
  value,
  onChange,
  required = false,
  placeholder = 'Descreva o motivo...',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        Motivo{required ? ' *' : ''}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cn(fieldInputClassName, 'mt-2 resize-none')}
      />
    </div>
  );
}

export function EnderecoActionDialogs({
  dialogState,
  isSubmitting,
  onClose,
  onConfirmBlock,
  onConfirmUnblock,
  onConfirmChangeStatus,
  onConfirmMassBlock,
}: EnderecoActionDialogsProps) {
  const [motivo, setMotivo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<EnderecoStatus | ''>('');

  useEffect(() => {
    if (dialogState) {
      setMotivo('');
      if (dialogState.type === 'change-status') {
        const options = ALL_STATUSES.filter(
          (status) => status !== dialogState.currentStatus,
        );
        setSelectedStatus(options[0] ?? '');
      } else {
        setSelectedStatus('');
      }
    }
  }, [dialogState]);

  const open = dialogState !== null;
  const motivoTrimmed = motivo.trim();
  const blockMotivoValid = motivoTrimmed.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      onClose();
    }
  };

  if (!dialogState) {
    return null;
  }

  if (dialogState.type === 'block') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear endereço</DialogTitle>
            <DialogDescription>
              Bloquear o endereço{' '}
              <span className="font-mono font-semibold">
                {dialogState.enderecoLabel}
              </span>
              . Informe o motivo do bloqueio.
            </DialogDescription>
          </DialogHeader>
          <MotivoTextarea
            id="block-motivo"
            value={motivo}
            onChange={setMotivo}
            required
            placeholder="Ex.: Manutenção estrutural, avaria no piso..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!blockMotivoValid || isSubmitting}
              onClick={() => onConfirmBlock(motivoTrimmed)}
            >
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (dialogState.type === 'mass-block') {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloqueio em massa</DialogTitle>
            <DialogDescription>
              Bloquear {dialogState.count} endereço(s) selecionado(s). O mesmo
              motivo será aplicado a todos.
            </DialogDescription>
          </DialogHeader>
          <MotivoTextarea
            id="mass-block-motivo"
            value={motivo}
            onChange={setMotivo}
            required
            placeholder="Ex.: Interdição da área por manutenção..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!blockMotivoValid || isSubmitting}
              onClick={() => onConfirmMassBlock(motivoTrimmed)}
            >
              Bloquear {dialogState.count} endereço(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (dialogState.type === 'unblock') {
    const nextStatus =
      dialogState.ocupacaoPercent > 0 ? 'ocupado' : 'disponivel';

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear endereço</DialogTitle>
            <DialogDescription>
              Desbloquear o endereço{' '}
              <span className="font-mono font-semibold">
                {dialogState.enderecoLabel}
              </span>
              ? O status será alterado para{' '}
              <span className="font-semibold">
                {ENDERECO_STATUS_LABELS[nextStatus]}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <MotivoTextarea
            id="unblock-motivo"
            value={motivo}
            onChange={setMotivo}
            placeholder="Motivo do desbloqueio (opcional)..."
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() =>
                onConfirmUnblock(motivoTrimmed || undefined)
              }
            >
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const statusOptions = ALL_STATUSES.filter(
    (status) => status !== dialogState.currentStatus,
  );
  const requiresMotivo = selectedStatus === 'bloqueado';
  const canConfirm =
    selectedStatus !== '' &&
    (!requiresMotivo || blockMotivoValid) &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar status</DialogTitle>
          <DialogDescription>
            Alterar o status do endereço{' '}
            <span className="font-mono font-semibold">
              {dialogState.enderecoLabel}
            </span>
            . Status atual:{' '}
            <span className="font-semibold">
              {ENDERECO_STATUS_LABELS[dialogState.currentStatus]}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="change-status-select" className={fieldLabelClassName}>
              Novo status *
            </label>
            <select
              id="change-status-select"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as EnderecoStatus)
              }
              className={cn(fieldInputClassName, 'mt-2')}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {ENDERECO_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <MotivoTextarea
            id="change-status-motivo"
            value={motivo}
            onChange={setMotivo}
            required={requiresMotivo}
            placeholder={
              requiresMotivo
                ? 'Motivo do bloqueio (obrigatório)...'
                : 'Motivo da alteração (opcional)...'
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            disabled={!canConfirm}
            onClick={() => {
              if (selectedStatus) {
                onConfirmChangeStatus(
                  selectedStatus,
                  motivoTrimmed || undefined,
                );
              }
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
