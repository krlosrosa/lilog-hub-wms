'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  addCentro,
  createUnidade,
  deleteCentro,
  updateCentro,
  updateUnidade,
} from '@/features/filiais/lib/unidade-api';
import type { CentroCadastroFormValues } from '@/features/filiais/types/centro-cadastro.schema';
import type { CentroAtrelado, FilialFormValues } from '@/features/filiais/types/filial.schema';
import { filialFormSchema } from '@/features/filiais/types/filial.schema';
import { ApiClientError } from '@/lib/api';

export const FILIAL_FORM_DEFAULT_VALUES: FilialFormValues = {
  id: '',
  nome: '',
  cluster: 'Cross',
  nomeFilial: '',
};

export type FilialFormSeedConfig = {
  key: string;
  values: FilialFormValues;
};

export type UseFilialFormOptions = {
  mode?: 'create' | 'edit';
  unidadeId?: string;
  seed?: FilialFormSeedConfig | null;
  initialCentros?: CentroAtrelado[];
};

export function useFilialForm(options?: UseFilialFormOptions | null) {
  const router = useRouter();
  const mode = options?.mode ?? 'create';
  const unidadeId = options?.unidadeId;
  const seed = options?.seed ?? null;

  const form = useForm<FilialFormValues>({
    resolver: zodResolver(filialFormSchema),
    defaultValues: FILIAL_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!seed) {
      return;
    }

    form.reset(seed.values);
  }, [form, seed]);

  const [centros, setCentros] = useState<CentroAtrelado[]>(
    options?.initialCentros ?? [],
  );
  const [centroModalOpen, setCentroModalOpen] = useState(false);
  const [centroEmEdicao, setCentroEmEdicao] = useState<CentroAtrelado | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (options?.initialCentros) {
      setCentros(options.initialCentros);
    }
  }, [options?.initialCentros]);

  const onSubmit = form.handleSubmit(
    async (data: FilialFormValues) => {
    if (centros.length === 0) {
      toast.error('Adicione ao menos um centro antes de salvar.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const created = await createUnidade({
          id: data.id,
          nome: data.nome,
          cluster: data.cluster,
          nomeFilial: data.nomeFilial,
          centros: centros.map((centro) => ({
            centro: centro.centro,
            empresa: centro.empresa,
            nome: centro.nome,
          })),
        });

        toast.success('Unidade criada!', {
          description: `${created.nome} (${created.id})`,
        });

        router.push(`/unidades/${created.id}`);
        return;
      }

      if (!unidadeId) {
        throw new Error('ID da unidade não informado');
      }

      await updateUnidade(unidadeId, {
        nome: data.nome,
        cluster: data.cluster,
        nomeFilial: data.nomeFilial,
      });

      toast.success('Unidade atualizada!', {
        description: data.nome,
      });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a unidade';

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  },
    () => {
      toast.error('Preencha todos os campos obrigatórios antes de salvar.');
    },
  );

  const cancelar = useCallback(() => {
    if (seed) {
      form.reset(seed.values);
      toast.info('Alterações revertidas.', { duration: 2000 });
      return;
    }

    form.reset(FILIAL_FORM_DEFAULT_VALUES);
    setCentros([]);
    toast.info('Formulário limpo.', { duration: 2000 });
  }, [form, seed]);

  const definirCentroModalOpen = useCallback((aberto: boolean) => {
    setCentroModalOpen(aberto);

    if (!aberto) {
      setCentroEmEdicao(null);
    }
  }, []);

  const abrirModalNovoCentro = useCallback(() => {
    setCentroEmEdicao(null);
    setCentroModalOpen(true);
  }, []);

  const iniciarEdicaoCentro = useCallback((centro: CentroAtrelado) => {
    setCentroEmEdicao(centro);
    setCentroModalOpen(true);
  }, []);

  const salvarCentroModal = useCallback(
    async (
      data: CentroCadastroFormValues,
      editingInternalRowId: string | null,
    ) => {
      const centroCodigo = data.centro.trim();
      const nomeLimpo = data.nome.trim();
      const centroDuplicado = centros.some(
        (item) =>
          item.centro === centroCodigo && item.id !== editingInternalRowId,
      );

      if (centroDuplicado) {
        toast.error('Já existe um centro com este código na unidade.');
        throw new Error('Centro duplicado');
      }

      if (mode === 'create' || !unidadeId) {
        if (editingInternalRowId) {
          setCentros((prev) =>
            prev.map((row) =>
              row.id === editingInternalRowId
                ? {
                    ...row,
                    centro: centroCodigo,
                    nome: nomeLimpo,
                    empresa: data.empresa,
                  }
                : row,
            ),
          );

          toast.success('Centro atualizado');
          return;
        }

        setCentros((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            centro: centroCodigo,
            nome: nomeLimpo,
            empresa: data.empresa,
          },
        ]);

        toast.success('Centro adicionado');
        return;
      }

      try {
        if (editingInternalRowId) {
          const updated = await updateCentro(unidadeId, editingInternalRowId, {
            centro: centroCodigo,
            nome: nomeLimpo,
            empresa: data.empresa,
          });

          setCentros((prev) =>
            prev.map((row) =>
              row.id === editingInternalRowId
                ? {
                    id: updated.id,
                    centro: updated.centro,
                    nome: updated.nome,
                    empresa: updated.empresa,
                  }
                : row,
            ),
          );

          toast.success('Centro atualizado');
          return;
        }

        const created = await addCentro(unidadeId, {
          centro: centroCodigo,
          nome: nomeLimpo,
          empresa: data.empresa,
        });

        setCentros((prev) => [
          ...prev,
          {
            id: created.id,
            centro: created.centro,
            nome: created.nome,
            empresa: created.empresa,
          },
        ]);

        toast.success('Centro adicionado');
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível salvar o centro';

        toast.error(message);
        throw error;
      }
    },
    [centros, mode, unidadeId],
  );

  const excluirCentro = useCallback(
    async (centro: CentroAtrelado) => {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(
          `Remover "${centro.nome}" (${centro.centro}) da unidade?`,
        );

      if (!ok) {
        return;
      }

      if (mode === 'create' || !unidadeId) {
        setCentros((prev) => prev.filter((item) => item.id !== centro.id));
        toast.success('Centro removido');
        return;
      }

      try {
        await deleteCentro(unidadeId, centro.id);
        setCentros((prev) => prev.filter((item) => item.id !== centro.id));
        toast.success('Centro removido');
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível excluir o centro';

        toast.error(message);
      }
    },
    [mode, unidadeId],
  );

  return {
    form,
    mode,
    unidadeId,
    centros,
    centroModalOpen,
    centroEmEdicao,
    definirCentroModalOpen,
    abrirModalNovoCentro,
    iniciarEdicaoCentro,
    salvarCentroModal,
    excluirCentro,
    isSubmitting,
    onSubmit,
    cancelar,
  };
}
