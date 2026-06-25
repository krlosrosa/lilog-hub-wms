'use client';

import { cn } from '@lilog/ui';
import { FolderTree, Plus, Trash2 } from 'lucide-react';

import { ConditionRow } from '@/features/regras-wms/components/condition-row';
import { useArvoreCondicoes } from '@/features/regras-wms/hooks/use-arvore-condicoes';
import type { NodePath } from '@/features/regras-wms/lib/arvore-condicoes-utils';
import {
  GRUPO_OPERADOR_LABELS,
  type GrupoCondicoes,
  type GrupoOperador,
  type NoCondicao,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

type ConditionGroupProps = {
  grupo: GrupoCondicoes;
  path: NodePath;
  depth: number;
  onRemoveGrupo?: () => void;
};

const MAX_DEPTH = 4;

export function ConditionGroup({
  grupo,
  path,
  depth,
  onRemoveGrupo,
}: ConditionGroupProps) {
  const {
    changeGrupoOperador,
    changeFolha,
    removeNode,
    addCondicao,
    addGrupo,
  } = useArvoreCondicoes();

  const canNest = depth < MAX_DEPTH;

  return (
    <div
      className={cn(
        'rounded-md border border-outline-variant/80 bg-surface-low/20',
        depth > 0 && 'ml-3 border-l-2 border-l-primary/20 pl-2',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <FolderTree className="size-3 text-primary" aria-hidden />
          <span className="text-[10px] font-medium text-muted-foreground">
            Subgrupo
          </span>
          <div
            className="flex rounded-md border border-outline-variant bg-surface-low p-0.5"
            role="group"
            aria-label="Operador do subgrupo"
          >
            {(['all', 'any', 'not'] as GrupoOperador[]).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => changeGrupoOperador(path, op)}
                className={cn(
                  'rounded px-1.5 py-px text-[9px] font-semibold transition-all',
                  grupo.operador === op
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {GRUPO_OPERADOR_LABELS[op]}
              </button>
            ))}
          </div>
        </div>
        {onRemoveGrupo && (
          <button
            type="button"
            onClick={onRemoveGrupo}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remover subgrupo"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      <div className="space-y-1 p-1.5">
        {grupo.filhos.map((filho, index) => (
          <ConditionNode
            key={filho.id}
            no={filho}
            path={[...path, index]}
            depth={depth + 1}
          />
        ))}

        <div className="flex gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => addCondicao(path)}
            className="inline-flex items-center gap-1 rounded border border-dashed border-outline-variant px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="size-2.5" aria-hidden />
            Condição
          </button>
          {canNest && (
            <button
              type="button"
              onClick={() => addGrupo(path)}
              className="inline-flex items-center gap-1 rounded border border-dashed border-outline-variant px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="size-2.5" aria-hidden />
              Subgrupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type ConditionNodeProps = {
  no: NoCondicao;
  path: NodePath;
  depth: number;
};

function ConditionNode({ no, path, depth }: ConditionNodeProps) {
  const { changeFolha, removeNode } = useArvoreCondicoes();

  if (no.tipo === 'condicao') {
    return (
      <ConditionRow
        folha={no}
        onChange={(folha) => changeFolha(path, folha)}
        onRemove={() => removeNode(path)}
      />
    );
  }

  return (
    <ConditionGroup
      grupo={no}
      path={path}
      depth={depth}
      onRemoveGrupo={() => removeNode(path)}
    />
  );
}
