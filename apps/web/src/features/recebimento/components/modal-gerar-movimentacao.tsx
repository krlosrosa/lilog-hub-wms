'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  empresaOptionValues,
  labelEmpresa,
  type EmpresaCodigo,
} from '@/features/filiais/types/centro-cadastro.schema';
import { postGerarMovimentacao } from '@/features/recebimento/lib/recebimento-api';

type ModalGerarMovimentacaoProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
};

type CentrosPorEmpresaState = Partial<Record<EmpresaCodigo, string>>;

function isCentroValido(value: string | undefined): boolean {
  return /^\d{4}$/.test(value?.trim() ?? '');
}

export function ModalGerarMovimentacao({
  open,
  onClose,
  selectedIds,
}: ModalGerarMovimentacaoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centrosPorEmpresa, setCentrosPorEmpresa] =
    useState<CentrosPorEmpresaState>({});

  const centrosPreenchidos = useMemo(
    () =>
      empresaOptionValues.filter((empresa) =>
        isCentroValido(centrosPorEmpresa[empresa]),
      ),
    [centrosPorEmpresa],
  );

  const podeGerar = useMemo(() => {
    if (selectedIds.length === 0 || centrosPreenchidos.length === 0) {
      return false;
    }

    return empresaOptionValues.every((empresa) => {
      const valor = centrosPorEmpresa[empresa]?.trim() ?? '';
      return valor.length === 0 || isCentroValido(valor);
    });
  }, [centrosPorEmpresa, centrosPreenchidos.length, selectedIds.length]);

  const resetState = useCallback(() => {
    setCentrosPorEmpresa({});
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleGerar = useCallback(async () => {
    if (!podeGerar) {
      return;
    }

    const centrosInformados = Object.fromEntries(
      centrosPreenchidos.map((empresa) => [
        empresa,
        centrosPorEmpresa[empresa]!.trim(),
      ]),
    ) as CentrosPorEmpresaState;

    setIsSubmitting(true);

    try {
      const { filename } = await postGerarMovimentacao({
        preRecebimentoIds: selectedIds,
        centrosPorEmpresa: centrosInformados,
      });

      toast.success('Planilha de movimentação gerada', {
        description: filename,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a movimentação';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [centrosPreenchidos, centrosPorEmpresa, onClose, podeGerar, selectedIds]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="border-outline-variant bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="size-4 text-primary" aria-hidden />
            Gerar movimentação MIGO
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedIds.length === 1
              ? '1 recebimento selecionado'
              : `${selectedIds.length} recebimentos selecionados`}
            . Informe manualmente o centro (4 dígitos) de cada empresa presente
            nos produtos. A planilha usará os itens conferidos, limitados à
            quantidade contábil e abatendo avarias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {empresaOptionValues.map((empresa) => {
            const valor = centrosPorEmpresa[empresa] ?? '';
            const invalido = valor.length > 0 && !isCentroValido(valor);

            return (
              <label
                key={empresa}
                className="block space-y-1.5"
                htmlFor={`centro-${empresa}`}
              >
                <span className="text-xs font-semibold text-foreground">
                  Centro — {labelEmpresa(empresa)}
                </span>
                <input
                  id={`centro-${empresa}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Ex.: 7202"
                  value={valor}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, '');
                    setCentrosPorEmpresa((atual) => ({
                      ...atual,
                      [empresa]: nextValue,
                    }));
                  }}
                  className="h-9 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {invalido ? (
                  <span className="text-[11px] text-destructive">
                    Informe exatamente 4 dígitos numéricos.
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Preencha apenas se houver produtos desta empresa.
                  </span>
                )}
              </label>
            );
          })}

          <div className="rounded-lg border border-outline-variant/70 bg-surface-low/40 px-3 py-2 text-xs text-muted-foreground">
            Depósito de origem: <strong className="text-foreground">pati</strong>{' '}
            · Destino: <strong className="text-foreground">gerl</strong> ·
            Movimentação: <strong className="text-foreground">311</strong>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleGerar()}
            disabled={!podeGerar || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Gerando…
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-4" aria-hidden />
                Gerar planilha
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
