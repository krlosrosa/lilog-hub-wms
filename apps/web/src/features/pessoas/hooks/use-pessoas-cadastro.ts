'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import { FUNCIONARIO_CARGOS } from '@lilog/contracts';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { listUnidades } from '@/features/filiais/lib/unidade-api';
import type { UnidadeApi } from '@/features/filiais/types/unidade.api';
import type { FuncionarioCargoApi } from '@/features/funcionarios/types/funcionario.api';
import {
  createPessoa,
  listPessoas,
  updatePessoa,
} from '@/features/pessoas/lib/pessoa-api';
import {
  pessoaFormSchema,
  type PessoaFormValues,
  type PessoaPerfil,
} from '@/features/pessoas/types/pessoa.schema';
import {
  addEquipeFuncionario,
  getFuncionarioEquipe,
  listEquipes,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EquipeApi } from '@/features/sessao-operacao/types/equipe.api';

export const PESSOA_FORM_DEFAULT_VALUES: PessoaFormValues = {
  matricula: '',
  nomeCompleto: '',
  cargo: 'separador',
  equipeId: '',
  dataAdmissao: '',
  unidadeId: '',
  concederAcesso: false,
  role: 'operador',
  senha: '',
  email: '',
};

const CARGOS_CADASTRO = new Set<string>(FUNCIONARIO_CARGOS);

function mapCargoFromApi(cargo: string): PessoaFormValues['cargo'] {
  if (CARGOS_CADASTRO.has(cargo)) {
    return cargo as PessoaFormValues['cargo'];
  }

  return 'separador';
}

function mapRoleToPerfil(role: string | null): PessoaPerfil {
  if (role === 'admin') return 'admin';
  if (role === 'leader' || role === 'manager') return 'lider';
  return 'operador';
}

export function usePessoasCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeContextId = unidadeSelecionada?.id;

  const form = useForm<PessoaFormValues>({
    resolver: zodResolver(pessoaFormSchema),
    defaultValues: PESSOA_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unidadesOpcoes, setUnidadesOpcoes] = useState<UnidadeApi[]>([]);
  const [equipesOpcoes, setEquipesOpcoes] = useState<EquipeApi[]>([]);
  const [equipeAnteriorId, setEquipeAnteriorId] = useState<string | null>(null);
  const [userIdExistente, setUserIdExistente] = useState<number | null>(null);

  const unidadeSelecionadaForm = form.watch('unidadeId');

  const loadEquipes = useCallback(
    async (targetUnidadeId: string) => {
      try {
        const response = await listEquipes({ unidadeId: targetUnidadeId });
        setEquipesOpcoes(response.items);

        const equipeAtual = form.getValues('equipeId');
        const equipeValida = response.items.some(
          (item) => item.id === equipeAtual,
        );

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
        const unidadesDaOperacao = unidadeContextId
          ? response.items.filter((item) => item.id === unidadeContextId)
          : response.items;

        setUnidadesOpcoes(unidadesDaOperacao);

        if (!editId && unidadeContextId && unidadesDaOperacao.length > 0) {
          form.setValue('unidadeId', unidadeContextId, { shouldValidate: true });
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
  }, [editId, form, unidadeContextId]);

  useEffect(() => {
    if (!unidadeSelecionadaForm) {
      setEquipesOpcoes([]);
      return;
    }

    void loadEquipes(unidadeSelecionadaForm);
  }, [loadEquipes, unidadeSelecionadaForm]);

  useEffect(() => {
    if (!editId) return;

    async function loadPessoa() {
      setIsLoading(true);

      try {
        const response = await listPessoas({
          funcionarioId: Number(editId),
          limit: 1,
        });
        const pessoa = response.items[0];

        if (!pessoa) {
          toast.error('Pessoa não encontrada');
          return;
        }

        const equipeResponse = await getFuncionarioEquipe(pessoa.funcionarioId);
        const equipeId = equipeResponse.equipeId ?? '';
        setEquipeAnteriorId(equipeResponse.equipeId);
        setUserIdExistente(pessoa.userId);

        form.reset({
          matricula: pessoa.matricula,
          nomeCompleto: pessoa.nome,
          cargo: mapCargoFromApi(pessoa.cargo),
          equipeId,
          dataAdmissao: pessoa.dataAdmissao.slice(0, 10),
          unidadeId: pessoa.unidadeId,
          concederAcesso: Boolean(pessoa.userId),
          role: mapRoleToPerfil(pessoa.userRole),
          senha: '',
          email: pessoa.userEmail ?? '',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao carregar pessoa';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (unidadesOpcoes.length > 0) {
      void loadPessoa();
    }
  }, [editId, form, unidadesOpcoes]);

  const onSubmit = form.handleSubmit(async (data: PessoaFormValues) => {
    if (data.concederAcesso) {
      if (
        data.email?.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
      ) {
        form.setError('email', { message: 'E-mail inválido' });
        return;
      }

      if (!editId && !data.senha?.trim()) {
        form.setError('senha', { message: 'Informe a senha de acesso' });
        return;
      }

      if (
        editId &&
        data.concederAcesso &&
        !userIdExistente &&
        !data.senha?.trim()
      ) {
        form.setError('senha', {
          message: 'Informe a senha para conceder acesso',
        });
        return;
      }

      if (data.senha?.trim() && data.senha.trim().length < 6) {
        form.setError('senha', {
          message: 'A senha deve ter no mínimo 6 caracteres',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editId) {
        await updatePessoa(Number(editId), {
          unidadeId: data.unidadeId,
          nome: data.nomeCompleto.trim(),
          cargo: data.cargo as FuncionarioCargoApi,
          dataAdmissao: data.dataAdmissao,
          equipeId: data.equipeId,
          concederAcesso: data.concederAcesso,
          role: data.role ?? 'operador',
          senha: data.senha?.trim() || undefined,
          email: data.email?.trim() || undefined,
          userId: userIdExistente,
        });

        if (data.equipeId && data.equipeId !== equipeAnteriorId) {
          await addEquipeFuncionario(data.equipeId, Number(editId));
        }

        toast.success('Pessoa atualizada!');
      } else {
        const created = await createPessoa({
          unidadeId: data.unidadeId,
          matricula: data.matricula.trim(),
          nome: data.nomeCompleto.trim(),
          cargo: data.cargo as FuncionarioCargoApi,
          dataAdmissao: data.dataAdmissao,
          equipeId: data.equipeId,
          concederAcesso: data.concederAcesso,
          role: data.role ?? 'operador',
          senha: data.senha?.trim(),
          email: data.email?.trim() || undefined,
        });

        await addEquipeFuncionario(data.equipeId, created.id);

        if (created.usuario) {
          toast.success('Pessoa e acesso criados!', {
            description: `Login ID ${data.matricula.trim()}`,
          });
        } else {
          toast.success('Pessoa salva!', {
            description: `Matrícula ${data.matricula.trim()}`,
          });
        }
      }

      router.push('/pessoas');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar pessoa';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/pessoas');
  }, [router]);

  return {
    form,
    isEditMode: Boolean(editId),
    isSubmitting: isSubmitting || isLoading,
    isLoading,
    unidadesOpcoes,
    equipesOpcoes,
    userIdExistente,
    onSubmit,
    cancelar,
  };
}
