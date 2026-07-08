'use client';

import { useCallback, useRef, useState } from 'react';

import { Button } from '@lilog/ui';
import { FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { ImportacaoPreviewTable } from '@/features/recebimento/components/importacao-preview-table';
import { ImportacaoProdutosAlerta } from '@/features/recebimento/components/importacao-produtos-alerta';
import { sectionCardClassName } from '@/features/recebimento/components/form-field-classes';
import {
  ParseRecebimentoError,
  parseRecebimentoXlsx,
  type RecebimentoXlsxDemanda,
  type RecebimentoXlsxResult,
} from '@/features/recebimento/lib/parse-recebimento-xlsx';
import {
  aplicarProdutosValidadosNasDemandas,
  validarProdutosImportacao,
} from '@/features/recebimento/lib/validar-produtos-importacao';

const formatoInt = new Intl.NumberFormat('pt-BR');

type ImportacaoPanelProps = {
  onCadastrarDemandas: (demandas: RecebimentoXlsxDemanda[]) => Promise<void>;
  onEditarDemanda?: (demanda: RecebimentoXlsxDemanda) => void;
  onPreviewChange?: (preview: RecebimentoXlsxResult | null) => void;
  isSubmittingDemandas?: boolean;
};

export function ImportacaoPanel({
  onCadastrarDemandas,
  onEditarDemanda,
  onPreviewChange,
  isSubmittingDemandas = false,
}: ImportacaoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreviewState] = useState<RecebimentoXlsxResult | null>(null);
  const [produtosSemCadastro, setProdutosSemCadastro] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const setPreview = useCallback(
    (value: RecebimentoXlsxResult | null) => {
      setPreviewState(value);
      onPreviewChange?.(value);
    },
    [onPreviewChange],
  );

  const abrirExplorador = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const processarArquivo = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return;
      }

      setIsProcessing(true);
      setProdutosSemCadastro([]);

      try {
        const result = await parseRecebimentoXlsx(file);
        const validacao = await validarProdutosImportacao(result.demandas);
        const demandasEnriquecidas = aplicarProdutosValidadosNasDemandas(
          result.demandas,
          validacao.validos,
        );

        const previewAtualizado: RecebimentoXlsxResult = {
          ...result,
          demandas: demandasEnriquecidas,
        };

        setPreview(previewAtualizado);
        setProdutosSemCadastro(validacao.naoEncontrados);

        const totalItens = demandasEnriquecidas.reduce(
          (total, demanda) => total + demanda.itens.length,
          0,
        );

        if (validacao.naoEncontrados.length > 0) {
          toast.error('Produtos sem cadastro', {
            description: `${validacao.naoEncontrados.length} SKU(s) precisam ser cadastrados antes do recebimento.`,
          });
        } else if (result.erros.length > 0) {
          toast.warning('Planilha importada com avisos', {
            description: `${result.demandas.length} demanda(s) · ${result.erros.slice(0, 2).join(' · ')}`,
          });
        } else {
          toast.success('Planilha validada', {
            description: `${result.demandas.length} demanda(s) · ${totalItens} item(ns) · produtos OK`,
          });
        }
      } catch (error) {
        const message =
          error instanceof ParseRecebimentoError
            ? error.message
            : 'Não foi possível ler a planilha';

        toast.error(message);
        setPreview(null);
        setProdutosSemCadastro([]);
      } finally {
        setIsProcessing(false);
        const el = inputRef.current;
        if (el) {
          el.value = '';
        }
      }
    },
    [setPreview],
  );

  const onPickArquivo = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      void processarArquivo(event.target.files?.[0]);
    },
    [processarArquivo],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      void processarArquivo(e.dataTransfer.files?.[0]);
    },
    [processarArquivo],
  );

  const limparArquivo = useCallback(() => {
    setPreview(null);
    setProdutosSemCadastro([]);
  }, [setPreview]);

  const cadastrarDemandas = useCallback(() => {
    if (!preview?.demandas.length) {
      return;
    }

    if (produtosSemCadastro.length > 0) {
      toast.error('Cadastro bloqueado', {
        description: 'Cadastre os produtos pendentes antes de registrar os recebimentos.',
      });
      return;
    }

    void onCadastrarDemandas(preview.demandas);
  }, [onCadastrarDemandas, preview, produtosSemCadastro.length]);

  const demandas = preview?.demandas ?? [];
  const totalItens = demandas.reduce(
    (total, demanda) => total + demanda.itens.length,
    0,
  );
  const possuiProdutosPendentes = produtosSemCadastro.length > 0;

  return (
    <section className={sectionCardClassName} aria-labelledby="titulo-import">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="titulo-import" className="text-sm font-semibold text-foreground">
            Importar romaneio
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Cada OCR da planilha vira um pré-recebimento (veículo) independente.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 items-center gap-1 rounded-full border border-outline-variant/80 px-1.5 text-[10px] text-muted-foreground">
            <FileSpreadsheet className="size-3" aria-hidden />
            .XLSX
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={onPickArquivo}
      />

      {!preview ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-10 transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/80 bg-muted/5 hover:border-primary/40 hover:bg-primary/5'
          }`}
          onClick={abrirExplorador}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              abrirExplorador();
            }
          }}
        >
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted/60">
            {isProcessing ? (
              <Loader2
                className="size-5 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : (
              <UploadCloud className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            {isProcessing ? 'Validando produtos…' : 'Arraste a planilha ou clique para selecionar'}
          </p>
          <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
            Os SKUs serão conferidos com o cadastro de produtos
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-7 border-outline-variant text-xs"
            disabled={isProcessing}
            onClick={(ev) => {
              ev.stopPropagation();
              abrirExplorador();
            }}
          >
            Selecionar arquivo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span
                className={`inline-flex size-1.5 shrink-0 rounded-full ${
                  possuiProdutosPendentes ? 'bg-destructive' : 'bg-status-active'
                }`}
                aria-hidden
              />
              {formatoInt.format(demandas.length)} OCR(s) ·{' '}
              {formatoInt.format(totalItens)} item(ns)
              {possuiProdutosPendentes
                ? ` · ${produtosSemCadastro.length} SKU(s) pendente(s)`
                : ' · produtos validados'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-primary"
              onClick={limparArquivo}
            >
              Trocar arquivo
            </Button>
          </div>

          <ImportacaoProdutosAlerta produtosSemCadastro={produtosSemCadastro} />

          {preview.erros.length > 0 ? (
            <div
              className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-700 dark:text-amber-400"
              role="alert"
            >
              {preview.erros.slice(0, 5).map((erro) => (
                <p key={erro}>{erro}</p>
              ))}
            </div>
          ) : null}

          <ImportacaoPreviewTable
            demandas={demandas}
            produtosSemCadastro={produtosSemCadastro}
            onEditarDemanda={onEditarDemanda}
          />

          <div className="flex flex-col items-end gap-1 border-t border-outline-variant/40 pt-3">
            {possuiProdutosPendentes ? (
              <p className="text-[11px] text-destructive">
                Cadastre os produtos pendentes para habilitar o registro.
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={
                isSubmittingDemandas ||
                demandas.length === 0 ||
                possuiProdutosPendentes
              }
              onClick={cadastrarDemandas}
            >
              {isSubmittingDemandas ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Cadastrando…
                </>
              ) : (
                `Cadastrar ${demandas.length} demanda(s)`
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
