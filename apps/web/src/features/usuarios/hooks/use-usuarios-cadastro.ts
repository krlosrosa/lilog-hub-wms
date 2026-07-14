'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listUnidades } from '@/features/filiais/lib/unidade-api';
import type { UnidadeApi } from '@/features/filiais/types/unidade.api';
import { listFuncionarios } from '@/features/funcionarios/lib/funcionario-api';
import type { FuncionarioApi } from '@/features/funcionarios/types/funcionario.api';
import {
  createUser,
  listUsers,
  mapPerfilToRole,
  updateUser,
} from '@/features/usuarios/lib/usuario-api';
import {
  usuarioFormSchema,
  type UnidadeAcessoNivel,
  type UnidadeAtribuida,
  type UsuarioFormValues,
} from '@/features/usuarios/types/usuarios-cadastro.schema';

export const USUARIO_FORM_DEFAULT_VALUES: UsuarioFormValues = {
  loginId: '',
  nomeCompleto: '',
  email: '',
  telefone: '',
  senha: '',
  employeeId: '',
  cargo: '',
  departamento: '',
  perfil: 'operador',
  unidades: [],
};

function mapUnidadeApiToAtribuida(unidade: UnidadeApi): UnidadeAtribuida {
  return {
    id: unidade.id,
    nome: unidade.nome,
    localizacao: unidade.nomeFilial,
    nivelAcesso: 'leitura_gravacao',
  };
}

export function useUsuariosCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: USUARIO_FORM_DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unidadesOpcoes, setUnidadesOpcoes] = useState<UnidadeApi[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioApi[]>([]);

  const unidadesSelecionadas = form.watch('unidades');
  const unidadesIds = useMemo(
    () => unidadesSelecionadas.map((unidade) => unidade.id),
    [unidadesSelecionadas],
  );

  const funcionariosFiltrados = useMemo(() => {
    if (unidadesIds.length === 0) return funcionarios;

    return funcionarios.filter((funcionario) =>
      unidadesIds.includes(funcionario.unidadeId),
    );
  }, [funcionarios, unidadesIds]);

  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true);

      try {
        const [unidadesResponse, funcionariosResponse] = await Promise.all([
          listUnidades({ page: 1, limit: 100 }),
          listFuncionarios({
            page: 1,
            limit: 200,
            situacao: 'ativo',
            unidadeId,
          }),
        ]);

        const unidadesDaOperacao = unidadeId
          ? unidadesResponse.items.filter((item) => item.id === unidadeId)
          : unidadesResponse.items;

        setUnidadesOpcoes(unidadesDaOperacao);
        setFuncionarios(funcionariosResponse.items);

        if (!editId && unidadeId && unidadesDaOperacao.length > 0) {
          form.setValue(
            'unidades',
            unidadesDaOperacao.map(mapUnidadeApiToAtribuida),
            { shouldValidate: true },
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao carregar dados do formulário';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadOptions();
  }, [editId, form, unidadeId]);

  useEffect(() => {
    if (!editId) return;

    async function loadUser() {
      setIsLoading(true);

      try {
        const response = await listUsers({ limit: 100 });
        const user = response.items.find((item) => String(item.id) === editId);

        if (!user) {
          toast.error('Usuário não encontrado');
          return;
        }

        const funcionario = funcionarios.find(
          (item) => item.id === user.funcionarioId,
        );

        const unidadesDoFuncionario = funcionario
          ? unidadesOpcoes
              .filter((unidade) => unidade.id === funcionario.unidadeId)
              .map(mapUnidadeApiToAtribuida)
          : [];

        form.reset({
          loginId: String(user.id),
          nomeCompleto: user.name,
          email: user.email,
          telefone: '',
          senha: '',
          employeeId: user.funcionarioId ? String(user.funcionarioId) : '',
          cargo: funcionario?.cargo ?? '',
          departamento: '',
          perfil:
            user.role === 'admin'
              ? 'admin'
              : user.role === 'leader'
                ? 'lider'
              : user.role === 'manager'
                ? 'gerente'
                : 'operador',
          unidades: unidadesDoFuncionario,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao carregar usuário';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    if (unidadesOpcoes.length > 0) {
      void loadUser();
    }
  }, [editId, form, funcionarios, unidadesOpcoes]);

  const onSubmit = form.handleSubmit(async (data: UsuarioFormValues) => {
    if (!editId && !data.senha?.trim()) {
      form.setError('senha', { message: 'Informe a senha de acesso' });
      return;
    }

    setIsSubmitting(true);

    try {
      const funcionarioId = Number(data.employeeId);

      if (!Number.isFinite(funcionarioId) || funcionarioId <= 0) {
        toast.error('Selecione um funcionário válido');
        return;
      }

      const funcionario = funcionarios.find((item) => item.id === funcionarioId);

      if (
        funcionario &&
        !data.unidades.some((unidade) => unidade.id === funcionario.unidadeId)
      ) {
        toast.error('O funcionário deve pertencer a uma das unidades selecionadas');
        return;
      }

      if (editId) {
        await updateUser(Number(editId), {
          name: data.nomeCompleto.trim(),
          email: data.email.trim(),
          role: mapPerfilToRole(data.perfil),
          funcionarioId,
          unidadesIds: data.unidades.map((unidade) => unidade.id),
          ...(data.senha?.trim() ? { password: data.senha.trim() } : {}),
        });
        toast.success('Usuário atualizado!');
      } else {
        await createUser({
          id: Number(data.loginId),
          name: data.nomeCompleto.trim(),
          email: data.email.trim(),
          password: data.senha!.trim(),
          role: mapPerfilToRole(data.perfil),
          status: 'pendente',
          funcionarioId,
          unidadesIds: data.unidades.map((unidade) => unidade.id),
        });
        toast.success('Perfil de usuário salvo!', {
          description: `Use o ID ${data.loginId} para fazer login`,
        });
      }

      router.push('/usuarios');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar usuário';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const cancelar = useCallback(() => {
    router.push('/usuarios');
  }, [router]);

  const toggleUnidade = useCallback(
    (unidadeId: string) => {
      const unidade = unidadesOpcoes.find((item) => item.id === unidadeId);

      if (!unidade) return;

      const current = form.getValues('unidades');
      const exists = current.some((item) => item.id === unidadeId);

      if (exists) {
        if (current.length <= 1) {
          toast.error('Selecione ao menos uma unidade.');
          return;
        }

        const next = current.filter((item) => item.id !== unidadeId);
        form.setValue('unidades', next, { shouldValidate: true });

        const employeeId = form.getValues('employeeId');
        const funcionario = funcionarios.find(
          (item) => String(item.id) === employeeId,
        );

        if (funcionario && funcionario.unidadeId === unidadeId) {
          form.setValue('employeeId', '', { shouldValidate: true });
        }
      } else {
        form.setValue(
          'unidades',
          [...current, mapUnidadeApiToAtribuida(unidade)],
          { shouldValidate: true },
        );
      }
    },
    [form, funcionarios, unidadesOpcoes],
  );

  const alterarNivelAcesso = useCallback(
    (unidadeId: string, nivelAcesso: UnidadeAcessoNivel) => {
      const current = form.getValues('unidades');
      form.setValue(
        'unidades',
        current.map((unidade) =>
          unidade.id === unidadeId ? { ...unidade, nivelAcesso } : unidade,
        ),
        { shouldValidate: true },
      );
    },
    [form],
  );

  const removerUnidade = useCallback(
    (unidadeId: string) => {
      toggleUnidade(unidadeId);
      toast.info('Unidade removida');
    },
    [toggleUnidade],
  );

  return {
    form,
    isEditMode: Boolean(editId),
    isSubmitting: isSubmitting || isLoading,
    isLoading,
    unidadesOpcoes,
    unidadesIds,
    funcionariosFiltrados,
    toggleUnidade,
    alterarNivelAcesso,
    onSubmit,
    cancelar,
    removerUnidade,
  };
}
