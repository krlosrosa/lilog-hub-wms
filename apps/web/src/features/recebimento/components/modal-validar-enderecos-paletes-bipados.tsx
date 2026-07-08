'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from 'lucide-react';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
} from '@/components/ui/compact-table-classes';
import type {
  PaleteBipadoValidadoFinalizacao,
  PreviewPaleteBipado,
  PreviewPaletesBipados,
} from '@/features/recebimento/types/etiqueta-armazenagem.schema';

type ModalValidarEnderecosPaletesBipadosProps = {
  open: boolean;
  onClose: () => void;
  onLoadPreview: () => Promise<PreviewPaletesBipados>;
  onConfirm: (paletes: PaleteBipadoValidadoFinalizacao[]) => Promise<void>;
  isSubmitting?: boolean;
};

type PaleteEditavel = PreviewPaleteBipado & {
  enderecoSugeridoId: string;
  enderecoSugeridoLabel: string;
  disponivel: boolean;
};

export function ModalValidarEnderecosPaletesBipados({
  open,
  onClose,
  onLoadPreview,
  onConfirm,
  isSubmitting = false,
}: ModalValidarEnderecosPaletesBipadosProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [numeroRecebimento, setNumeroRecebimento] = useState('');
  const [paletes, setPaletes] = useState<PaleteEditavel[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const paletesSemEndereco = useMemo(
    () =>
      paletes.filter(
        (palete) => !palete.enderecoSugeridoId || !palete.disponivel,
      ),
    [paletes],
  );

  const resetState = useCallback(() => {
    setIsLoading(false);
    setNumeroRecebimento('');
    setPaletes([]);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void onLoadPreview()
      .then((result) => {
        if (cancelled) return;

        setNumeroRecebimento(result.numeroRecebimento);
        setPaletes(
          result.paletes.map((palete) => ({
            ...palete,
            enderecoSugeridoId: palete.enderecoSugeridoId ?? '',
            enderecoSugeridoLabel: palete.enderecoSugeridoLabel ?? '',
            disponivel: Boolean(palete.enderecoSugeridoId && palete.disponivel),
          })),
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os paletes bipados',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, onLoadPreview, resetState]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose],
  );

  const handleEnderecoChange = useCallback(
    (
      unitizadorId: string,
      enderecoSugeridoId: string,
      enderecoSugeridoLabel: string,
    ) => {
      setPaletes((current) =>
        current.map((palete) =>
          palete.unitizadorId === unitizadorId
            ? {
                ...palete,
                enderecoSugeridoId,
                enderecoSugeridoLabel,
                disponivel: enderecoSugeridoLabel.trim().length > 0,
                alerta: null,
              }
            : palete,
        ),
      );
    },
    [],
  );

  const handleConfirmar = useCallback(async () => {
    const paletesValidados: PaleteBipadoValidadoFinalizacao[] = paletes
      .filter((palete) => palete.enderecoSugeridoId)
      .map((palete) => ({
        unitizadorId: palete.unitizadorId,
        enderecoSugeridoId: palete.enderecoSugeridoId,
      }));

    await onConfirm(paletesValidados);
  }, [onConfirm, paletes]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-outline-variant bg-surface-low px-6 py-4 text-left">
          <DialogTitle className="text-headline-md font-bold text-primary">
            Validar Endereços dos Paletes
          </DialogTitle>
          <DialogDescription>
            Confirme ou ajuste o endereço sugerido para cada palete bipado antes
            de finalizar o recebimento.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Carregando paletes e endereços sugeridos…
              </p>
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-3 text-sm">
                <p className="font-semibold text-foreground">
                  Recebimento #{numeroRecebimento}
                </p>
                <p className="text-muted-foreground">
                  {paletes.length} palete{paletes.length === 1 ? '' : 's'} para
                  validação
                </p>
              </div>

              {paletesSemEndereco.length > 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>
                    {paletesSemEndereco.length} palete(s) sem endereço disponível.
                    Ajuste manualmente antes de finalizar.
                  </p>
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                <table className={compactTableClassName}>
                  <thead>
                    <tr>
                      <th className={compactTableHeadCellClassName()}>Palete</th>
                      <th className={compactTableHeadCellClassName()}>Itens</th>
                      <th className={compactTableHeadCellClassName()}>Endereço</th>
                      <th className={compactTableHeadCellClassName()}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {paletes.map((palete) => (
                      <tr key={palete.unitizadorId}>
                        <td className="px-3 py-2">
                          <div className="font-mono text-sm font-semibold text-foreground">
                            {palete.codigoUnitizador}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {palete.sequencia}/{paletes.length}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {palete.itens.map((item) => (
                              <div key={`${palete.unitizadorId}-${item.produtoId}`}>
                                <div className="font-semibold text-foreground">
                                  {item.sku}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Intl.NumberFormat('pt-BR').format(
                                    item.quantidade,
                                  )}{' '}
                                  {item.unidadeMedida}
                                  {item.lote ? ` · Lote ${item.lote}` : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={palete.enderecoSugeridoLabel}
                            placeholder="Informe o endereço"
                            disabled={isSubmitting}
                            className="h-8 min-w-[120px] rounded-md border border-outline-variant bg-background px-2 text-sm"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleEnderecoChange(
                                palete.unitizadorId,
                                palete.enderecoSugeridoId,
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {palete.disponivel && palete.enderecoSugeridoId ? (
                            <span className="text-secondary">Disponível</span>
                          ) : (
                            <span className="text-destructive">
                              {palete.alerta ?? 'Indisponível'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-outline-variant bg-surface-low p-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isLoading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting ||
              isLoading ||
              Boolean(loadError) ||
              paletes.length === 0 ||
              paletesSemEndereco.length > 0
            }
            onClick={() => void handleConfirmar()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Finalizando…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" aria-hidden />
                Confirmar e Finalizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
