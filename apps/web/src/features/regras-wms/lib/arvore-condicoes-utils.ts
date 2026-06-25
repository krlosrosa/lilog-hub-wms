import {
  CAMPO_CONDICAO_LABELS,
  OPERADOR_CONDICAO_LABELS,
} from '@/features/regras-wms/types/regra-wms.schema';
import type {
  ArvoreCondicoes,
  CondicaoFolha,
  GrupoCondicoes,
  GrupoOperador,
  NoCondicao,
} from '@/features/regras-wms/types/regra-wms-tree.schema';
import {
  GRUPO_OPERADOR_LABELS,
  createEmptyCondicaoFolha,
  createGrupoCondicoes,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

export type NodePath = number[];

function cloneArvore(arvore: ArvoreCondicoes): ArvoreCondicoes {
  return JSON.parse(JSON.stringify(arvore)) as ArvoreCondicoes;
}

function getGrupoAtPath(
  arvore: ArvoreCondicoes,
  path: NodePath,
): GrupoCondicoes | null {
  if (path.length === 0) return null;

  let filhos = arvore.filhos;
  let node: NoCondicao | undefined;

  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index === undefined) return null;
    node = filhos[index];
    if (!node) return null;
    if (i < path.length - 1) {
      if (node.tipo !== 'grupo') return null;
      filhos = node.filhos;
    }
  }

  return node?.tipo === 'grupo' ? node : null;
}

function setFilhosAtParentPath(
  arvore: ArvoreCondicoes,
  parentPath: NodePath,
  filhos: NoCondicao[],
): ArvoreCondicoes {
  const next = cloneArvore(arvore);

  if (parentPath.length === 0) {
    next.filhos = filhos;
    return next;
  }

  const grupo = getGrupoAtPath(next, parentPath);
  if (!grupo) return arvore;
  grupo.filhos = filhos;
  return next;
}

function getFilhosAtParentPath(
  arvore: ArvoreCondicoes,
  parentPath: NodePath,
): NoCondicao[] {
  if (parentPath.length === 0) return arvore.filhos;
  const grupo = getGrupoAtPath(arvore, parentPath);
  return grupo?.filhos ?? [];
}

export function getParentPath(path: NodePath): NodePath {
  return path.slice(0, -1);
}

export function setRootOperador(
  arvore: ArvoreCondicoes,
  operador: GrupoOperador,
): ArvoreCondicoes {
  return { ...cloneArvore(arvore), operador };
}

export function setGrupoOperadorAtPath(
  arvore: ArvoreCondicoes,
  path: NodePath,
  operador: GrupoOperador,
): ArvoreCondicoes {
  const next = cloneArvore(arvore);
  const grupo = getGrupoAtPath(next, path);
  if (!grupo) return arvore;
  grupo.operador = operador;
  return next;
}

export function updateFolhaAtPath(
  arvore: ArvoreCondicoes,
  path: NodePath,
  folha: CondicaoFolha,
): ArvoreCondicoes {
  const parentPath = getParentPath(path);
  const index = path[path.length - 1];
  if (index === undefined) return arvore;
  const filhos = [...getFilhosAtParentPath(arvore, parentPath)];
  if (filhos[index]?.tipo !== 'condicao') return arvore;
  filhos[index] = folha;
  return setFilhosAtParentPath(arvore, parentPath, filhos);
}

export function updateGrupoAtPath(
  arvore: ArvoreCondicoes,
  path: NodePath,
  grupo: GrupoCondicoes,
): ArvoreCondicoes {
  const parentPath = getParentPath(path);
  const index = path[path.length - 1];
  if (index === undefined) return arvore;
  const filhos = [...getFilhosAtParentPath(arvore, parentPath)];
  if (filhos[index]?.tipo !== 'grupo') return arvore;
  filhos[index] = grupo;
  return setFilhosAtParentPath(arvore, parentPath, filhos);
}

export function removeNodeAtPath(
  arvore: ArvoreCondicoes,
  path: NodePath,
): ArvoreCondicoes | null {
  const parentPath = getParentPath(path);
  const index = path[path.length - 1];
  if (index === undefined) return arvore;
  const filhos = [...getFilhosAtParentPath(arvore, parentPath)];

  if (filhos.length <= 1) return null;

  filhos.splice(index, 1);
  return setFilhosAtParentPath(arvore, parentPath, filhos);
}

export function addCondicaoAtPath(
  arvore: ArvoreCondicoes,
  parentPath: NodePath = [],
): ArvoreCondicoes {
  const filhos = [
    ...getFilhosAtParentPath(arvore, parentPath),
    createEmptyCondicaoFolha(),
  ];
  return setFilhosAtParentPath(arvore, parentPath, filhos);
}

export function addGrupoAtPath(
  arvore: ArvoreCondicoes,
  parentPath: NodePath = [],
): ArvoreCondicoes {
  const filhos = [
    ...getFilhosAtParentPath(arvore, parentPath),
    createGrupoCondicoes('all'),
  ];
  return setFilhosAtParentPath(arvore, parentPath, filhos);
}

export function countFolhas(arvore: ArvoreCondicoes): number {
  function countNodes(nos: NoCondicao[]): number {
    return nos.reduce((acc, no) => {
      if (no.tipo === 'condicao') return acc + 1;
      return acc + countNodes(no.filhos);
    }, 0);
  }
  return countNodes(arvore.filhos);
}

function formatFolha(folha: CondicaoFolha): string {
  const campo = CAMPO_CONDICAO_LABELS[folha.campo];
  const op = OPERADOR_CONDICAO_LABELS[folha.operador].toLowerCase();
  const valor =
    folha.operador === 'entre' && folha.valorFim
      ? `${folha.valor}–${folha.valorFim}`
      : folha.valor;
  return `${campo} ${op} ${valor}`;
}

function formatNo(no: NoCondicao): string {
  if (no.tipo === 'condicao') return formatFolha(no);
  const label = GRUPO_OPERADOR_LABELS[no.operador];
  const inner = no.filhos.map(formatNo).join(
    no.operador === 'all' ? ' e ' : no.operador === 'any' ? ' ou ' : ' ',
  );
  return no.operador === 'not' ? `NÃO (${inner})` : `(${inner})`;
}

export function formatArvoreResumo(arvore: ArvoreCondicoes): string {
  const rootLabel = GRUPO_OPERADOR_LABELS[arvore.operador];
  const partes = arvore.filhos.map(formatNo);
  const conector =
    arvore.operador === 'all'
      ? ' e '
      : arvore.operador === 'any'
        ? ' ou '
        : ' ';
  const corpo = partes.join(conector);
  return arvore.operador === 'not' ? `NÃO ${corpo}` : `${rootLabel}: ${corpo}`;
}

export function cloneNoCondicaoComNovosIds(no: NoCondicao): NoCondicao {
  if (no.tipo === 'condicao') {
    return { ...no, id: crypto.randomUUID() };
  }
  return {
    ...no,
    id: crypto.randomUUID(),
    filhos: no.filhos.map(cloneNoCondicaoComNovosIds),
  };
}

export function cloneArvoreCondicoes(arvore: ArvoreCondicoes): ArvoreCondicoes {
  return {
    operador: arvore.operador,
    filhos: arvore.filhos.map(cloneNoCondicaoComNovosIds),
  };
}
