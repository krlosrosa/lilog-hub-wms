'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listUnidades } from '@/features/filiais/lib/unidade-api';
import type { UnidadeApi } from '@/features/filiais/types/unidade.api';
import {
  createFuncionario,
  listFuncionarios,
  updateFuncionario,
} from '@/features/funcionarios/lib/funcionario-api';
import type { FuncionarioCargoApi } from '@/features/funcionarios/types/funcionario.api';
import {
  funcionarioFormSchema,
  type FuncionarioFormValues,
} from '@/features/funcionarios/types/funcionarios-cadastro.schema';
import {
  addEquipeFuncionario,
  getFuncionarioEquipe,
  listEquipes,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EquipeApi } from '@/features/sessao-operacao/types/equipe.api';

export const FUNCIONARIO_FORM_DEFAULT_VALUES: FuncionarioFormValues = {
  nomeCompleto: '',
  matricula: '',
  cargo: 'separador',
  equipeId: '',
  turno: 'manha',
  dataAdmissao: '',
  unidadesIds: [],
  criarUsuarioAdmin: false,
  usuarioEmail: '',
  usuarioSenha: '',
};

const CARGOS_CADASTRO = new Set<FuncionarioCargoApi>([
  'operador_empilhadeira',
  'separador',
  'conferente',
  'ajudante',
  'administrativo',
]);

function mapCargoFromApi(cargo: FuncionarioCargoApi): FuncionarioFormValues['cargo'] {
  if (CARGOS_CADASTRO.has(cargo)) {
    return cargo as FuncionarioFormValues['cargo'];
  }

  return 'separador';
}

export function useFuncionariosCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const form = useForm<FuncionarioFormValues>({
    resolver: zodResolver(funcionarioFormSchema),
    defaultValues: FUNCIONARIO_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unidadesOpcoes, setUnidadesOpcoes] = useState<UnidadeApi[]>([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState<EquipeApi[]>([]);
  const [equipeAnteriorId, setEquipeAnteriorId] = useState<string | null>(null);

  const unidadeSelecionadaForm = form.watch('unidadesIds')[0];

  const loadEquipes = useCallback(
    async (targetUnidadeId: string) => {
      try {
        const response = await listEquipes({ unidadeId: targetUnidadeId });
        setEquipesOpcoes(response.items);

        const equipeAtual = form.getValues('equipeId');
        const equipeValida = response.items.some((item) => item.id === equipeAtual);

        if (!equipeValida) {
          form.setValue('equipeId', '', { shouldValidate: true });
        }
      } catch {
        setEquipesOpcoes([]);
        toast.error('Não foi possível carregar os departamentos (equipes).');
      }
    },
    [form],
  );

  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true);

      try {
        const response = await listUnidades({ page: 1, limit: 100 });
        const unidadesDaOperacao = unidadeId
          ? response.items.filter((item) => item.id === unidadeId)
          : response.items;

        setUnidadesOpcoes(unidadesDaOperacao);

        if (!editId && unidadeId && unidadesDaOperacao.length > 0) {
          form.setValue('unidadesIds', [unidadeId], { shouldValidate: true });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao carregar unidades';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadOptions();
  }, [editId, form, unidadeId]);

  useEffect(() => {
    if (!unidadeSelecionadaForm) {
      setEquipesOpcoes([]);
      return;
    }

    void loadEquipes(unidadeSelecionadaForm);
  }, [loadEquipes, unidadeSelecionadaForm]);

  useEffect(() => {
    if (!editId) return;

    async function loadFuncionario() {
      setIsLoading(true);

      try {
        const response = await listFuncionarios({
          limit: 100,
          unidadeId,
        });
        const funcionario = response.items.find(
          (item) => String(item.id) === editId,
        );

        if (!funcionario) {
          toast.error('Funcionário não encontrado');
          return;
        }

        const equipeResponse = await getFuncionarioEquipe(funcionario.id);
        const equipeId = equipeResponse.equipeId ?? '';
        setEquipeAnteriorId(equipeResponse.equipeId);

        form.reset({
          nomeCompleto: funcionario.nome,
          matricula: funcionario.matricula,
          cargo: mapCargoFromApi(funcionario.cargo),
          equipeId,
          turno: 'manha',
          dataAdmissao: funcionario.dataAdmissao.slice(0, 10),
          unidadesIds: [funcionario.unidadeId],
          criarUsuarioAdmin: false,
          usuarioEmail: '',
          usuarioSenha: '',
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao carregar funcionário';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (unidadesOpcoes.length > 0) {
      void loadFuncionario();
    }
  }, [editId, form, unidadesOpcoes, unidadeId]);

  const onSubmit = form.handleSubmit(async (data: FuncionarioFormValues) => {
    setIsSubmitting(true);

    try {
      const unidadeId = data.unidadesIds[0];

      if (!unidadeId) {
        toast.error('Selecione ao menos uma unidade operacional.');
        return;
      }

      const payload = {
        unidadeId,
        matricula: data.matricula.trim(),
        nome: data.nomeCompleto.trim(),
        cargo: data.cargo,
        dataAdmissao: data.dataAdmissao,
        situacao: 'ativo' as const,
        ...(data.criarUsuarioAdmin
          ? {
              criarUsuarioAdmin: true,
              usuarioSenha: data.usuarioSenha?.trim(),
              ...(data.usuarioEmail?.trim()
                ? { email: data.usuarioEmail.trim() }
                : {}),
            }
          : {}),
      };

      if (editId) {
        await updateFuncionario(Number(editId), payload);

        if (data.equipeId && data.equipeId !== equipeAnteriorId) {
          await addEquipeFuncionario(data.equipeId, Number(editId));
        }

        toast.success('Funcionário atualizado!');
      } else {
        const created = await createFuncionario(payload);
        await addEquipeFuncionario(data.equipeId, created.id);

        if (created.usuario) {
          toast.success('Funcionário e usuário admin criados!', {
            description: `Login ID ${data.matricula.trim()}`,
          });
        } else {
          toast.success('Funcionário salvo!', {
            description: `Matrícula ${data.matricula.trim()}`,
          });
        }
      }

      router.push('/funcionarios');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar funcionário';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/funcionarios');
  }, [router]);

  const toggleUnidade = useCallback(
    (unidadeId: string) => {
      const current = form.getValues('unidadesIds');
      const exists = current.includes(unidadeId);

      if (exists) {
        if (current.length <= 1) {
          toast.error('Selecione ao menos uma unidade operacional.');
          return;
        }
        form.setValue(
          'unidadesIds',
          current.filter((id) => id !== unidadeId),
          { shouldValidate: true },
        );
      } else {
        form.setValue('unidadesIds', [...current, unidadeId], {
          shouldValidate: true,
        });
      }
    },
    [form],
  );

  return {
    form,
    isEditMode: Boolean(editId),
    isSubmitting: isSubmitting || isLoading,
    isLoading,
    unidadesOpcoes,
    equipesOpcoes,
    onSubmit,
    cancelar,
    toggleUnidade,
  };
}
