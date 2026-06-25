'use client';

import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import {
  addCondicaoAtPath,
  addGrupoAtPath,
  removeNodeAtPath,
  setGrupoOperadorAtPath,
  setRootOperador,
  updateFolhaAtPath,
  updateGrupoAtPath,
  type NodePath,
} from '@/features/regras-wms/lib/arvore-condicoes-utils';
import type {
  ArvoreCondicoes,
  CondicaoFolha,
  GrupoCondicoes,
  GrupoOperador,
  RegraWmsV2Form,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

export function useArvoreCondicoes() {
  const { watch, setValue } = useFormContext<RegraWmsV2Form>();
  const arvore = watch('arvoreCondicoes');

  const commit = useCallback(
    (next: ArvoreCondicoes) => {
      setValue('arvoreCondicoes', next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const changeRootOperador = useCallback(
    (operador: GrupoOperador) => {
      commit(setRootOperador(arvore, operador));
    },
    [arvore, commit],
  );

  const changeGrupoOperador = useCallback(
    (path: NodePath, operador: GrupoOperador) => {
      commit(setGrupoOperadorAtPath(arvore, path, operador));
    },
    [arvore, commit],
  );

  const changeFolha = useCallback(
    (path: NodePath, folha: CondicaoFolha) => {
      commit(updateFolhaAtPath(arvore, path, folha));
    },
    [arvore, commit],
  );

  const changeGrupo = useCallback(
    (path: NodePath, grupo: GrupoCondicoes) => {
      commit(updateGrupoAtPath(arvore, path, grupo));
    },
    [arvore, commit],
  );

  const removeNode = useCallback(
    (path: NodePath) => {
      const next = removeNodeAtPath(arvore, path);
      if (!next) {
        toast.error('O grupo precisa ter ao menos um item');
        return;
      }
      commit(next);
    },
    [arvore, commit],
  );

  const addCondicao = useCallback(
    (parentPath: NodePath = []) => {
      commit(addCondicaoAtPath(arvore, parentPath));
    },
    [arvore, commit],
  );

  const addGrupo = useCallback(
    (parentPath: NodePath = []) => {
      commit(addGrupoAtPath(arvore, parentPath));
    },
    [arvore, commit],
  );

  return {
    arvore,
    changeRootOperador,
    changeGrupoOperador,
    changeFolha,
    changeGrupo,
    removeNode,
    addCondicao,
    addGrupo,
  };
}
