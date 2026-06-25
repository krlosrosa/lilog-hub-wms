'use client';

import { useEffect, useMemo, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import { addFuncionarioDemandaCarregamento } from '@/features/gestao-recursos/lib/gestao-recursos-api';
import type { DemandaSeparacaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

type AdicionarAuxiliarModalProps = {
  open: boolean;
  demanda: DemandaSeparacaoApi | null;
  funcionarios: SessaoFuncionarioApi[];
  isSubmitting: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
};

export function AdicionarAuxiliarModal({
  open,
  demanda,
  funcionarios,
  isSubmitting,
  onClose,
  onSuccess,
}: AdicionarAuxiliarModalProps) {
  const [sessaoFuncionarioId, setSessaoFuncionarioId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSessaoFuncionarioId(null);
    }
  }, [open]);

  const funcionariosElegiveis = useMemo(() => {
    if (!demanda) {
      return [];
    }

    const alocados = new Set(
      (demanda.funcionarios ?? []).map((item) => item.sessaoFuncionarioId),
    );

    return funcionarios.filter(
      (funcionario) =>
        (funcionario.status === 'presente' || funcionario.status === 'atraso') &&
        !alocados.has(funcionario.id),
    );
  }, [demanda, funcionarios]);

  const handleSubmit = async () => {
    if (!demanda || !sessaoFuncionarioId) {
      toast.error('Selecione um funcionário.');
      return;
    }

    setIsSaving(true);

    try {
      await addFuncionarioDemandaCarregamento(demanda.id, {
        sessaoFuncionarioId,
      });
      await onSuccess();
    } catch {
      toast.error('Não foi possível adicionar o auxiliar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar auxiliar</DialogTitle>
          <DialogDescription>
            Selecione um funcionário presente na sessão para ajudar no
            carregamento
            {demanda ? ` de ${demanda.mapaGrupoTitulo}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="auxiliar-funcionario"
            className="text-label-md font-medium text-foreground"
          >
            Funcionário
          </label>
          <select
            id="auxiliar-funcionario"
            value={sessaoFuncionarioId ?? ''}
            onChange={(event) =>
              setSessaoFuncionarioId(
                event.target.value ? event.target.value : null,
              )
            }
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecione o auxiliar</option>
            {funcionariosElegiveis.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nome} — {funcionario.cargo}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting ||
              isSaving ||
              !sessaoFuncionarioId ||
              funcionariosElegiveis.length === 0
            }
            onClick={() => void handleSubmit()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Adicionar auxiliar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
