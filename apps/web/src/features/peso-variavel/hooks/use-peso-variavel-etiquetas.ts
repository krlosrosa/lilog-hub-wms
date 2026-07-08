'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  expandirLinhasParaEtiquetas,
  totalEtiquetasDasLinhas,
} from '@/features/peso-variavel/lib/expandir-etiquetas';
import { gerarZplEtiquetas } from '@/features/peso-variavel/lib/gerar-zpl-etiquetas';
import { dispararImpressaoEtiquetas } from '@/features/peso-variavel/lib/imprimir-etiquetas';
import type { EtiquetasPrintVariante } from '@/features/peso-variavel/components/etiquetas-print-area';
import { downloadBlobArquivo } from '@/lib/api';
import {
  criarLinhasMockDoArquivo,
  parsearCsvSeparacao,
} from '@/features/peso-variavel/lib/parsear-arquivo-separacao';
import { MOCK_LINHAS_SEPARACAO } from '@/features/peso-variavel/mocks/peso-variavel-etiquetas-mock';
import type {
  EtiquetaSeparacao,
  LinhaSeparacao,
  LinhaSeparacaoStatus,
} from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function filtrarLinhas(linhas: LinhaSeparacao[], busca: string): LinhaSeparacao[] {
  const term = busca.trim().toLowerCase();
  if (!term) return linhas;

  return linhas.filter(
    (linha) =>
      linha.transporte.toLowerCase().includes(term) ||
      linha.remessa.toLowerCase().includes(term) ||
      linha.cliente.toLowerCase().includes(term) ||
      linha.nomeCliente.toLowerCase().includes(term) ||
      linha.sku.toLowerCase().includes(term) ||
      linha.descricao.toLowerCase().includes(term) ||
      linha.status.toLowerCase().includes(term),
  );
}

function atualizarStatusLinhas(
  linhas: LinhaSeparacao[],
  ids: Set<string>,
  status: LinhaSeparacaoStatus,
  preservarSeparado = true,
): LinhaSeparacao[] {
  return linhas.map((linha) => {
    if (!ids.has(linha.id)) return linha;
    if (preservarSeparado && linha.status === 'separado') return linha;
    return { ...linha, status };
  });
}

export function usePesoVariavelEtiquetas() {
  const [linhas, setLinhas] = useState<LinhaSeparacao[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [etiquetasGeradas, setEtiquetasGeradas] = useState<EtiquetaSeparacao[]>(
    [],
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const [busca, setBusca] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAdicionarModalOpen, setIsAdicionarModalOpen] = useState(false);
  const [isZebraModalOpen, setIsZebraModalOpen] = useState(false);
  const [printVariante, setPrintVariante] = useState<EtiquetasPrintVariante>('normal');
  const [isSalvandoBanco, setIsSalvandoBanco] = useState(false);
  const [ultimoArquivo, setUltimoArquivo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      await delay(400);
      if (!cancelled) {
        setLinhas([...MOCK_LINHAS_SEPARACAO]);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const linhasFiltradas = useMemo(
    () => filtrarLinhas(linhas, busca),
    [linhas, busca],
  );

  const linhasSelecionadas = useMemo(
    () => linhasFiltradas.filter((linha) => selectedIds.has(linha.id)),
    [linhasFiltradas, selectedIds],
  );

  const totalEtiquetasSelecionadas = useMemo(
    () => totalEtiquetasDasLinhas(linhasSelecionadas),
    [linhasSelecionadas],
  );

  const todasFiltradasSelecionadas =
    linhasFiltradas.length > 0 &&
    linhasFiltradas.every((linha) => selectedIds.has(linha.id));

  const algumasFiltradasSelecionadas =
    linhasFiltradas.some((linha) => selectedIds.has(linha.id)) &&
    !todasFiltradasSelecionadas;

  const previewEtiqueta = etiquetasGeradas[previewIndex] ?? null;

  const zplContent = useMemo(
    () => gerarZplEtiquetas(etiquetasGeradas),
    [etiquetasGeradas],
  );

  const resumo = useMemo(() => {
    const transportes = new Set(linhasFiltradas.map((linha) => linha.transporte));
    const remessas = new Set(linhasFiltradas.map((linha) => linha.remessa));

    return {
      totalTransportes: transportes.size,
      totalRemessas: remessas.size,
      totalCaixas: totalEtiquetasDasLinhas(linhasFiltradas),
    };
  }, [linhasFiltradas]);

  const resumoBanco = useMemo(
    () => ({
      totalLinhas: linhasSelecionadas.length,
      totalCaixas: totalEtiquetasDasLinhas(linhasSelecionadas),
    }),
    [linhasSelecionadas],
  );

  const toggleLinha = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleTodas = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (todasFiltradasSelecionadas) {
        linhasFiltradas.forEach((linha) => next.delete(linha.id));
      } else {
        linhasFiltradas.forEach((linha) => next.add(linha.id));
      }
      return next;
    });
  }, [linhasFiltradas, todasFiltradasSelecionadas]);

  const limparSelecao = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const gerarEtiquetas = useCallback(async () => {
    if (linhasSelecionadas.length === 0) {
      toast.error('Selecione ao menos uma linha para gerar etiquetas');
      return;
    }

    setIsGenerating(true);
    try {
      await delay(800);
      const expandidas = expandirLinhasParaEtiquetas(linhasSelecionadas);
      const idsGerados = new Set(linhasSelecionadas.map((linha) => linha.id));
      setLinhas((prev) =>
        atualizarStatusLinhas(prev, idsGerados, 'gerado'),
      );
      setEtiquetasGeradas(expandidas);
      setPreviewIndex(0);
      toast.success('Etiquetas geradas', {
        description: `${expandidas.length} etiqueta(s) prontas para impressão`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [linhasSelecionadas]);

  const imprimirEtiquetas = useCallback(async () => {
    if (etiquetasGeradas.length === 0) {
      toast.error('Gere as etiquetas antes de imprimir');
      return;
    }

    setIsPrinting(true);
    try {
      setPrintVariante('normal');
      const idsImpressos = new Set(
        etiquetasGeradas.map((etiqueta) => etiqueta.id),
      );
      setLinhas((prev) =>
        atualizarStatusLinhas(prev, idsImpressos, 'impresso'),
      );
      await dispararImpressaoEtiquetas();
      toast.success('Impressão iniciada', {
        description: `${etiquetasGeradas.length} etiqueta(s) no diálogo de impressão`,
      });
    } finally {
      setIsPrinting(false);
    }
  }, [etiquetasGeradas]);

  const imprimirEtiquetasZebra = useCallback(async () => {
    if (etiquetasGeradas.length === 0) {
      toast.error('Gere as etiquetas antes de imprimir');
      return;
    }

    setIsPrinting(true);
    try {
      setPrintVariante('zebra');
      const idsImpressos = new Set(
        etiquetasGeradas.map((etiqueta) => etiqueta.id),
      );
      setLinhas((prev) =>
        atualizarStatusLinhas(prev, idsImpressos, 'impresso'),
      );
      await dispararImpressaoEtiquetas();
      toast.success('Impressão Zebra iniciada', {
        description: `${etiquetasGeradas.length} etiqueta(s) em 100x150mm`,
      });
    } finally {
      setIsPrinting(false);
      setPrintVariante('normal');
    }
  }, [etiquetasGeradas]);

  const previewAnterior = useCallback(() => {
    setPreviewIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const previewProxima = useCallback(() => {
    setPreviewIndex((prev) =>
      Math.min(etiquetasGeradas.length - 1, prev + 1),
    );
  }, [etiquetasGeradas.length]);

  const uploadArquivos = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const importadas: LinhaSeparacao[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

        if (ext === 'csv' || ext === 'txt') {
          const texto = await file.text();
          const parsed = parsearCsvSeparacao(texto);
          if (parsed.length > 0) {
            importadas.push(...parsed);
          } else {
            importadas.push(...criarLinhasMockDoArquivo(file.name));
          }
        } else {
          importadas.push(...criarLinhasMockDoArquivo(file.name));
        }
      }

      if (importadas.length === 0) {
        toast.error('Nenhuma linha válida no arquivo');
        return;
      }

      setLinhas((prev) => [...prev, ...importadas]);
      setUltimoArquivo(
        files.length === 1 ? files[0]!.name : `${files.length} arquivos`,
      );
      toast.success('Arquivo importado', {
        description: `${importadas.length} linha(s) adicionada(s) à lista`,
      });
    } catch {
      toast.error('Falha ao ler o arquivo');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const abrirModalAdicionar = useCallback(() => {
    if (linhasSelecionadas.length === 0) {
      toast.error('Selecione ao menos uma linha para adicionar ao banco');
      return;
    }
    setIsAdicionarModalOpen(true);
  }, [linhasSelecionadas.length]);

  const fecharModalAdicionar = useCallback(() => {
    if (!isSalvandoBanco) {
      setIsAdicionarModalOpen(false);
    }
  }, [isSalvandoBanco]);

  const abrirModalZebra = useCallback(() => {
    if (etiquetasGeradas.length === 0) {
      toast.error('Gere as etiquetas antes de exportar para Zebra');
      return;
    }
    setIsZebraModalOpen(true);
  }, [etiquetasGeradas.length]);

  const fecharModalZebra = useCallback(() => {
    setIsZebraModalOpen(false);
  }, []);

  const copiarZpl = useCallback(async () => {
    if (!zplContent) {
      toast.error('Nenhum código ZPL disponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(zplContent);
      toast.success('ZPL copiado', {
        description: 'Código pronto para colar na impressora ou software Zebra',
      });
    } catch {
      toast.error('Falha ao copiar o código ZPL');
    }
  }, [zplContent]);

  const baixarZpl = useCallback(() => {
    if (!zplContent) {
      toast.error('Nenhum código ZPL disponível');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `etiquetas-peso-variavel-${timestamp}.zpl`;
    const blob = new Blob([zplContent], { type: 'text/plain;charset=utf-8' });
    downloadBlobArquivo(blob, filename);
    toast.success('Arquivo .zpl baixado', {
      description: `${etiquetasGeradas.length} etiqueta(s) no arquivo`,
    });
  }, [etiquetasGeradas.length, zplContent]);

  const confirmarAdicionarBanco = useCallback(async () => {
    if (linhasSelecionadas.length === 0) {
      toast.error('Nenhuma linha selecionada');
      return;
    }

    const idsSalvos = new Set(linhasSelecionadas.map((linha) => linha.id));
    const totalLinhas = linhasSelecionadas.length;
    const totalCaixas = totalEtiquetasDasLinhas(linhasSelecionadas);

    setIsSalvandoBanco(true);
    try {
      await delay(1200);
      setIsAdicionarModalOpen(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        idsSalvos.forEach((id) => next.delete(id));
        return next;
      });
      toast.success('Dados adicionados ao banco', {
        description: `${totalLinhas} linha(s) selecionada(s) · ${totalCaixas} caixa(s) persistidas (mock)`,
      });
    } finally {
      setIsSalvandoBanco(false);
    }
  }, [linhasSelecionadas]);

  return {
    linhas: linhasFiltradas,
    linhasTotal: linhas.length,
    selectedIds,
    isLoading,
    isGenerating,
    isPrinting,
    isUploading,
    isAdicionarModalOpen,
    isZebraModalOpen,
    isSalvandoBanco,
    ultimoArquivo,
    etiquetasGeradas,
    zplContent,
    printVariante,
    previewEtiqueta,
    previewIndex,
    previewTotal: etiquetasGeradas.length,
    busca,
    setBusca,
    totalEtiquetasSelecionadas,
    linhasSelecionadasCount: linhasSelecionadas.length,
    resumo,
    resumoBanco,
    todasFiltradasSelecionadas,
    algumasFiltradasSelecionadas,
    toggleLinha,
    toggleTodas,
    limparSelecao,
    gerarEtiquetas,
    imprimirEtiquetas,
    imprimirEtiquetasZebra,
    uploadArquivos,
    abrirModalAdicionar,
    fecharModalAdicionar,
    abrirModalZebra,
    fecharModalZebra,
    copiarZpl,
    baixarZpl,
    confirmarAdicionarBanco,
    previewAnterior,
    previewProxima,
  };
}
