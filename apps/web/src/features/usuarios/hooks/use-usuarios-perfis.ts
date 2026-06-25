'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  MOCK_PERFIS,
  MOCK_PERMISSOES_POR_PERFIL,
} from '@/features/usuarios/mocks/usuarios-mock-data';
import type {
  PermissaoAcaoKey,
  PermissaoModulo,
} from '@/features/usuarios/types/usuarios-perfis.schema';
import type { UsuarioPerfil } from '@/features/usuarios/types/usuarios-gestao.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cloneModulos(modulos: PermissaoModulo[]): PermissaoModulo[] {
  return modulos.map((m) => ({
    ...m,
    permissoes: { ...m.permissoes },
  }));
}

export function useUsuariosPerfis() {
  const [perfilSelecionado, setPerfilSelecionado] =
    useState<UsuarioPerfil>('admin');
  const [modulos, setModulos] = useState<PermissaoModulo[]>(() =>
    cloneModulos(MOCK_PERMISSOES_POR_PERFIL.admin),
  );
  const [modulosOriginais, setModulosOriginais] = useState<PermissaoModulo[]>(
    () => cloneModulos(MOCK_PERMISSOES_POR_PERFIL.admin),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [busca, setBusca] = useState('');

  const perfisFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return MOCK_PERFIS;
    return MOCK_PERFIS.filter(
      (p) =>
        p.label.toLowerCase().includes(term) ||
        p.descricao.toLowerCase().includes(term),
    );
  }, [busca]);

  const hasChanges = useMemo(
    () => JSON.stringify(modulos) !== JSON.stringify(modulosOriginais),
    [modulos, modulosOriginais],
  );

  const selecionarPerfil = useCallback((perfilId: UsuarioPerfil) => {
    const novosModulos = cloneModulos(MOCK_PERMISSOES_POR_PERFIL[perfilId]);
    setPerfilSelecionado(perfilId);
    setModulos(novosModulos);
    setModulosOriginais(cloneModulos(MOCK_PERMISSOES_POR_PERFIL[perfilId]));
  }, []);

  const togglePermissao = useCallback(
    (moduloId: string, acao: PermissaoAcaoKey, value: boolean) => {
      setModulos((prev) =>
        prev.map((modulo) =>
          modulo.id === moduloId
            ? {
                ...modulo,
                permissoes: { ...modulo.permissoes, [acao]: value },
              }
            : modulo,
        ),
      );
    },
    [],
  );

  const descartarAlteracoes = useCallback(() => {
    setModulos(cloneModulos(modulosOriginais));
    toast.info('Alterações descartadas');
  }, [modulosOriginais]);

  const salvarPermissoes = useCallback(async () => {
    setIsSaving(true);
    try {
      await delay(1000);
      setModulosOriginais(cloneModulos(modulos));
      toast.success('Permissões salvas', {
        description: `Perfil ${perfilSelecionado}`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [modulos, perfilSelecionado]);

  const exportarCsv = useCallback(async () => {
    await delay(600);
    toast.success('Matriz de permissões exportada');
  }, []);

  return {
    perfis: perfisFiltrados,
    perfilSelecionado,
    selecionarPerfil,
    modulos,
    togglePermissao,
    descartarAlteracoes,
    salvarPermissoes,
    isSaving,
    hasChanges,
    busca,
    setBusca,
    exportarCsv,
  };
}
