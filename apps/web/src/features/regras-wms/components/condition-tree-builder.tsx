'use client';

import { cn } from '@lilog/ui';
import { GitBranch, Plus } from 'lucide-react';

import { ConditionGroup } from '@/features/regras-wms/components/condition-group';
import { ConditionRow } from '@/features/regras-wms/components/condition-row';
import {
  fieldErrorClassName,
  sectionCardClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import { RegraWmsSectionHeader } from '@/features/regras-wms/components/regra-wms-section-header';
import { useArvoreCondicoes } from '@/features/regras-wms/hooks/use-arvore-condicoes';
import {
  GRUPO_OPERADOR_LABELS,
  type GrupoOperador,
  type NoCondicao,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

function RootConditionNode({
  no,
  index,
}: {
  no: NoCondicao;
  index: number;
}) {
  const { changeFolha, removeNode } = useArvoreCondicoes();
  const path = [index];

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
      depth={1}
      onRemoveGrupo={() => removeNode(path)}
    />
  );
}

export function ConditionTreeBuilder() {
  const { arvore, changeRootOperador, addCondicao, addGrupo } =
    useArvoreCondicoes();

  return (
    <section className={sectionCardClassName}>
      <RegraWmsSectionHeader
        step={2}
        icon={GitBranch}
        title="Condições"
        action={
          <div
            className="flex rounded-md border border-outline-variant bg-surface-low p-0.5"
            role="group"
            aria-label="Operador lógico raiz"
          >
            {(['all', 'any', 'not'] as GrupoOperador[]).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => changeRootOperador(op)}
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-semibold transition-all',
                  arvore.operador === op
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {GRUPO_OPERADOR_LABELS[op]}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-1">
        {arvore.filhos.map((no, index) => (
          <RootConditionNode key={no.id} no={no} index={index} />
        ))}
      </div>

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={() => addCondicao([])}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-outline-variant py-1.5 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary sm:flex-none sm:px-3"
        >
          <Plus className="size-3" aria-hidden />
          Condição
        </button>
        <button
          type="button"
          onClick={() => addGrupo([])}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-outline-variant py-1.5 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary sm:flex-none sm:px-3"
        >
          <Plus className="size-3" aria-hidden />
          Subgrupo
        </button>
      </div>

      {arvore.operador === 'not' && arvore.filhos.length > 1 && (
        <p role="alert" className={cn(fieldErrorClassName, 'mt-1.5')}>
          Operador NÃO aceita apenas um filho.
        </p>
      )}
    </section>
  );
}
