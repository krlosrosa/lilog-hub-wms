'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { criarEnderecosLote } from '@/features/enderecos/lib/endereco-api';
import {
  CONFIGURACAO_LOTE_DEFAULT,
  calcularQuantidadeRua,
  configuracaoLoteSchema,
  criarRuaLoteVazia,
  gerarPreviewItems,
  ruaLoteSchema,
  type ConfiguracaoLote,
  type PreviewItem,
  type RuaLote,
} from '@/features/enderecos/types/endereco-lote.schema';
import type { CurvaAbc, EnderecoTipo } from '@/features/enderecos/types/enderecos-gestao.schema';
import {
  getDefaultTipoEstrutura,
  isEnderecoTipoEstruturado,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { ApiClientError } from '@/lib/api';

const PREVIEW_PAGE_SIZE = 50;

export function useCadastroLote() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [configuracao, setConfiguracao] =
    useState<ConfiguracaoLote>(CONFIGURACAO_LOTE_DEFAULT);
  const [ruas, setRuas] = useState<RuaLote[]>([criarRuaLoteVazia()]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [previewPagina, setPreviewPagina] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalEstimado = useMemo(
    () => ruas.reduce((acc, rua) => acc + calcularQuantidadeRua(rua), 0),
    [ruas],
  );

  const totalPreviewPaginas = useMemo(
    () => Math.max(1, Math.ceil(previewItems.length / PREVIEW_PAGE_SIZE)),
    [previewItems.length],
  );

  const previewItemsPagina = useMemo(() => {
    const inicio = (previewPagina - 1) * PREVIEW_PAGE_SIZE;
    return previewItems.slice(inicio, inicio + PREVIEW_PAGE_SIZE);
  }, [previewItems, previewPagina]);

  const atualizarConfiguracao = useCallback(
    <K extends keyof ConfiguracaoLote>(field: K, value: ConfiguracaoLote[K]) => {
      setConfiguracao((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const adicionarRua = useCallback(() => {
    setRuas((prev) => [...prev, criarRuaLoteVazia()]);
  }, []);

  const removerRua = useCallback((id: string) => {
    setRuas((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.filter((rua) => rua.id !== id);
    });
  }, []);

  const atualizarRua = useCallback(
    <K extends keyof Omit<RuaLote, 'id'>>(id: string, field: K, value: RuaLote[K]) => {
      setRuas((prev) =>
        prev.map((rua) => (rua.id === id ? { ...rua, [field]: value } : rua)),
      );
    },
    [],
  );

  const toggleNivelRua = useCallback((id: string, nivel: number) => {
    setRuas((prev) =>
      prev.map((rua) => {
        if (rua.id !== id) {
          return rua;
        }

        const niveis = rua.niveis.includes(nivel)
          ? rua.niveis.filter((item) => item !== nivel)
          : [...rua.niveis, nivel].sort((a, b) => a - b);

        return { ...rua, niveis };
      }),
    );
  }, []);

  const validarEtapa1 = useCallback(() => {
    const parsed = configuracaoLoteSchema.safeParse(configuracao);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Configuração inválida');
      return false;
    }

    return true;
  }, [configuracao]);

  const validarEtapa2 = useCallback(() => {
    if (ruas.length === 0) {
      toast.error('Adicione ao menos uma rua');
      return false;
    }

    for (const rua of ruas) {
      const parsed = ruaLoteSchema.safeParse(rua);

      if (!parsed.success) {
        toast.error(
          parsed.error.issues[0]?.message ??
            `Rua ${rua.rua || 'sem identificação'} inválida`,
        );
        return false;
      }
    }

    if (totalEstimado === 0) {
      toast.error('Nenhum endereço será gerado com os parâmetros informados');
      return false;
    }

    if (totalEstimado > 5000) {
      toast.error('O lote não pode exceder 5.000 endereços');
      return false;
    }

    return true;
  }, [ruas, totalEstimado]);

  const avancarEtapa = useCallback(() => {
    if (step === 1) {
      if (!validarEtapa1()) {
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validarEtapa2()) {
        return;
      }

      const items = gerarPreviewItems(configuracao, ruas);
      setPreviewItems(items);
      setPreviewPagina(1);
      setStep(3);
    }
  }, [step, validarEtapa1, validarEtapa2, configuracao, ruas]);

  const voltarEtapa = useCallback(() => {
    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  }, [step]);

  const toggleEditarItem = useCallback((id: string) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, _editando: !item._editando } : item,
      ),
    );
  }, []);

  const updateItemField = useCallback(
    <K extends keyof PreviewItem>(id: string, field: K, value: PreviewItem[K]) => {
      setPreviewItems((prev) =>
        prev.map((item) => {
          if (item._id !== id) {
            return item;
          }

          const next = { ...item, [field]: value };

          if (field === 'tipo' && typeof value === 'string') {
            const tipo = value as EnderecoTipo;

            if (isEnderecoTipoEstruturado(tipo)) {
              next.tipoEstrutura = getDefaultTipoEstrutura(tipo) as PreviewItem['tipoEstrutura'];
            }
          }

          return next;
        }),
      );
    },
    [],
  );

  const removerItem = useCallback((id: string) => {
    setPreviewItems((prev) => prev.filter((item) => item._id !== id));
  }, []);

  const removerTodos = useCallback(() => {
    setPreviewItems([]);
  }, []);

  const submeter = useCallback(async () => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade antes de cadastrar endereços');
      return;
    }

    if (previewItems.length === 0) {
      toast.error('Nenhum endereço na lista para cadastrar');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await criarEnderecosLote(
        previewItems.map((item) => ({
          unidadeId,
          zona: item.zona,
          rua: item.rua,
          posicao: item.posicao,
          nivel: item.nivel,
          tipo: item.tipo,
          tipoEstrutura: item.tipoEstrutura,
          larguraMm: item.larguraMm,
          alturaMm: item.alturaMm,
          profundidadeMm: item.profundidadeMm,
          cargaMaxKg: item.cargaMaxKg,
          vinculoSkuFixo: item.vinculoSkuFixo,
          regraLoteUnico: item.regraLoteUnico,
          permiteMisturaValidade: false,
          permiteFracionado: false,
          curvaAbc: item.curvaAbc as CurvaAbc,
        })),
      );

      if (response.inserted > 0) {
        toast.success(
          `${response.inserted} endereço(s) criado(s)${response.errors.length > 0 ? `. ${response.errors.length} erro(s).` : '.'}`,
          { duration: 6000 },
        );
        router.push('/enderecos');
        return;
      }

      if (response.errors.length > 0) {
        toast.error(
          `Nenhum endereço criado. ${response.errors.length} erro(s) encontrado(s).`,
          { duration: 6000 },
        );
        return;
      }

      toast.info('Nenhum endereço foi criado.');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível criar os endereços em lote';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [previewItems, router, unidadeId]);

  const cancelar = useCallback(() => {
    router.push('/enderecos');
  }, [router]);

  return {
    step,
    configuracao,
    ruas,
    previewItems,
    previewItemsPagina,
    previewPagina,
    previewPageSize: PREVIEW_PAGE_SIZE,
    totalPreviewPaginas,
    totalEstimado,
    isSubmitting,
    unidadeLabel: unidadeSelecionada?.nome ?? '—',
    atualizarConfiguracao,
    adicionarRua,
    removerRua,
    atualizarRua,
    toggleNivelRua,
    avancarEtapa,
    voltarEtapa,
    toggleEditarItem,
    updateItemField,
    removerItem,
    removerTodos,
    setPreviewPagina,
    submeter,
    cancelar,
  };
}
