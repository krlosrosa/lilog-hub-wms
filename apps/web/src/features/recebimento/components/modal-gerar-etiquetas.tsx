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
import { AlertTriangle, Loader2, MapPin, Tags } from 'lucide-react';

import type {
  PaleteValidadoFinalizacao,
  PreviewPaleteArmazenagem,
  PreviewPaletesArmazenagem,
  SugestaoEtiquetaProduto,
} from '@/features/recebimento/types/etiqueta-armazenagem.schema';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
} from '@/components/ui/compact-table-classes';

type ModalGerarEtiquetasProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (paletes: PaleteValidadoFinalizacao[]) => Promise<void>;
  onLoadSugestao: () => Promise<{
    numeroRecebimento: string;
    itens: SugestaoEtiquetaProduto[];
  }>;
  onPreviewEnderecos: (
    paletes: Array<{ produtoId: string; qtdPaletes: number }>,
  ) => Promise<PreviewPaletesArmazenagem>;
  isSubmitting?: boolean;
};

type RevisaoItem = SugestaoEtiquetaProduto & {
  qtdPaletes: number;
};

type Step = 'revisao' | 'enderecos';

export function ModalGerarEtiquetas({
  open,
  onClose,
  onConfirm,
  onLoadSugestao,
  onPreviewEnderecos,
  isSubmitting = false,
}: ModalGerarEtiquetasProps) {
  const [step, setStep] = useState<Step>('revisao');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [numeroRecebimento, setNumeroRecebimento] = useState('');
  const [itensRevisao, setItensRevisao] = useState<RevisaoItem[]>([]);
  const [paletesPreview, setPaletesPreview] = useState<PreviewPaleteArmazenagem[]>(
    [],
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const totalEtiquetas = useMemo(
    () => itensRevisao.reduce((acc, item) => acc + item.qtdPaletes, 0),
    [itensRevisao],
  );

  const paletesSemEndereco = useMemo(
    () =>
      paletesPreview.filter(
        (palete) => !palete.enderecoSugeridoId || !palete.disponivel,
      ),
    [paletesPreview],
  );

  const resetState = useCallback(() => {
    setStep('revisao');
    setIsLoading(false);
    setIsPreviewLoading(false);
    setNumeroRecebimento('');
    setItensRevisao([]);
    setPaletesPreview([]);
    setLoadError(null);
    setPreviewError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void onLoadSugestao()
      .then((result) => {
        if (cancelled) return;

        setNumeroRecebimento(result.numeroRecebimento);
        setItensRevisao(
          result.itens.map((item) => ({
            ...item,
            qtdPaletes: item.qtdPaletesSugerida,
          })),
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a sugestão de paletes',
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
  }, [open, onLoadSugestao, resetState]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose],
  );

  const handleQtdPaletesChange = useCallback(
    (produtoId: string, value: string) => {
      const parsed = Number.parseInt(value, 10);
      const qtdPaletes = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

      setItensRevisao((current) =>
        current.map((item) =>
          item.produtoId === produtoId ? { ...item, qtdPaletes } : item,
        ),
      );
    },
    [],
  );

  const handleAvancarEnderecos = useCallback(async () => {
    const paletes = itensRevisao.map((item) => ({
      produtoId: item.produtoId,
      qtdPaletes: item.qtdPaletes,
    }));

    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const preview = await onPreviewEnderecos(paletes);
      setPaletesPreview(preview.paletes);
      setStep('enderecos');
    } catch (error: unknown) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o preview de endereços',
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }, [itensRevisao, onPreviewEnderecos]);

  const handleEnderecoChange = useCallback(
    (sequencia: number, enderecoSugeridoId: string, enderecoSugeridoLabel: string) => {
      setPaletesPreview((current) =>
        current.map((palete) =>
          palete.sequencia === sequencia
            ? {
                ...palete,
                enderecoSugeridoId,
                enderecoSugeridoLabel,
                disponivel: true,
                alerta: null,
              }
            : palete,
        ),
      );
    },
    [],
  );

  const handleConfirmar = useCallback(async () => {
    const paletesValidados: PaleteValidadoFinalizacao[] = paletesPreview
      .filter((palete) => palete.enderecoSugeridoId)
      .map((palete) => ({
        produtoId: palete.produtoId,
        sequencia: palete.sequencia,
        quantidade: palete.quantidade,
        enderecoSugeridoId: palete.enderecoSugeridoId!,
        codigoUnitizador: palete.codigoUnitizador,
      }));

    await onConfirm(paletesValidados);
  }, [onConfirm, paletesPreview]);

  const stepTitle =
    step === 'revisao' ? 'Gerar Etiquetas de Palete' : 'Validar Endereços';

  const stepDescription =
    step === 'revisao'
      ? 'Revise a quantidade de paletes por produto antes de sugerir endereços.'
      : 'Confirme ou ajuste o endereço sugerido para cada palete antes de finalizar.';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-outline-variant bg-surface-low px-6 py-4 text-left">
          <DialogTitle className="text-headline-md font-bold text-primary">
            {stepTitle}
          </DialogTitle>
          <DialogDescription>{stepDescription}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Calculando sugestão de paletes…
              </p>
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : step === 'revisao' ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-3 text-sm">
                <p className="font-semibold text-foreground">
                  Recebimento #{numeroRecebimento}
                </p>
                <p className="text-muted-foreground">
                  Total sugerido: {totalEtiquetas} etiqueta(s)
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
                <table className={compactTableClassName}>
                  <thead>
                    <tr>
                      <th className={compactTableHeadCellClassName()}>Produto</th>
                      <th className={compactTableHeadCellClassName()}>Qtd total</th>
                      <th className={compactTableHeadCellClassName()}>
                        Capacidade/palete
                      </th>
                      <th className={compactTableHeadCellClassName()}>Paletes</th>
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {itensRevisao.map((item) => (
                      <tr key={item.produtoId}>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-foreground">
                            {item.sku}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.descricao}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {new Intl.NumberFormat('pt-BR').format(
                            item.quantidadeTotalUN,
                          )}{' '}
                          UN
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {new Intl.NumberFormat('pt-BR').format(
                            item.capacidadePorPaleteUN,
                          )}{' '}
                          UN
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.qtdPaletes}
                            disabled={isSubmitting}
                            className="h-8 w-20 rounded-md border border-outline-variant bg-background px-2 text-sm"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleQtdPaletesChange(
                                item.produtoId,
                                event.target.value,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {previewError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {previewError}
                </div>
              ) : null}

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
                      <th className={compactTableHeadCellClassName()}>Produto</th>
                      <th className={compactTableHeadCellClassName()}>Quantidade</th>
                      <th className={compactTableHeadCellClassName()}>Endereço</th>
                      <th className={compactTableHeadCellClassName()}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {paletesPreview.map((palete) => (
                      <tr key={palete.sequencia}>
                        <td className="px-3 py-2 font-mono text-sm">
                          {palete.sequencia}/{paletesPreview.length}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-foreground">
                            {palete.sku}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {palete.codigoUnitizador}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {new Intl.NumberFormat('pt-BR').format(palete.quantidade)}{' '}
                          {palete.unidadeMedida}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={palete.enderecoSugeridoLabel ?? ''}
                            placeholder="Informe o endereço"
                            disabled={isSubmitting}
                            className="h-8 min-w-[120px] rounded-md border border-outline-variant bg-background px-2 text-sm"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleEnderecoChange(
                                palete.sequencia,
                                palete.enderecoSugeridoId ?? '',
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
          {step === 'revisao' ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isLoading || isPreviewLoading}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  isSubmitting ||
                  isLoading ||
                  isPreviewLoading ||
                  Boolean(loadError) ||
                  totalEtiquetas === 0
                }
                onClick={() => void handleAvancarEnderecos()}
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Calculando endereços…
                  </>
                ) : (
                  <>
                    <MapPin className="size-4" aria-hidden />
                    Validar endereços
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep('revisao')}
              >
                Voltar
              </Button>
              <Button
                type="button"
                disabled={
                  isSubmitting ||
                  paletesPreview.length === 0 ||
                  paletesSemEndereco.length > 0
                }
                onClick={() => void handleConfirmar()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Gerando etiquetas…
                  </>
                ) : (
                  <>
                    <Tags className="size-4" aria-hidden />
                    Gerar e Finalizar
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
