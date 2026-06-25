'use client';

import { cn } from '@lilog/ui';

import {
  CAMPO_CONDICAO_LABELS,
  OPERADOR_CONDICAO_LABELS,
} from '@/features/regras-wms/types/regra-wms.schema';
import {
  GRUPO_OPERADOR_LABELS,
  type ArvoreCondicoes,
  type CondicaoFolha,
  type GrupoCondicoes,
  type NoCondicao,
} from '@/features/regras-wms/types/regra-wms-tree.schema';

function FolhaPreview({ folha }: { folha: CondicaoFolha }) {
  const valor =
    folha.operador === 'entre' && folha.valorFim
      ? `${folha.valor || '?'} – ${folha.valorFim}`
      : folha.valor || '?';

  return (
    <span className="leading-snug">
      <span className="font-medium">{CAMPO_CONDICAO_LABELS[folha.campo]}</span>{' '}
      <span className="text-muted-foreground">
        {OPERADOR_CONDICAO_LABELS[folha.operador].toLowerCase()}
      </span>{' '}
      <span className="font-mono text-primary">{valor}</span>
    </span>
  );
}

function GrupoPreview({
  grupo,
  depth,
}: {
  grupo: GrupoCondicoes;
  depth: number;
}) {
  return (
    <div
      className={cn(
        'rounded border border-outline-variant/60 bg-surface-low/30 p-1.5',
        depth > 0 && 'ml-2 border-l-2 border-l-primary/15',
      )}
    >
      <p className="mb-1 text-[9px] font-semibold uppercase text-muted-foreground">
        {GRUPO_OPERADOR_LABELS[grupo.operador]}
      </p>
      <ul className="space-y-1">
        {grupo.filhos.map((filho) => (
          <li key={filho.id}>
            <NoPreview no={filho} depth={depth + 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoPreview({ no, depth }: { no: NoCondicao; depth: number }) {
  if (no.tipo === 'condicao') {
    return <FolhaPreview folha={no} />;
  }
  return <GrupoPreview grupo={no} depth={depth} />;
}

type ArvorePreviewProps = {
  arvore: ArvoreCondicoes;
};

export function ArvorePreview({ arvore }: ArvorePreviewProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
        Se ({GRUPO_OPERADOR_LABELS[arvore.operador]})
      </p>
      <ul className="space-y-1.5">
        {arvore.filhos.map((no) => (
          <li key={no.id} className="text-caption text-foreground">
            <NoPreview no={no} depth={0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
