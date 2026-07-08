'use client';

import { useState } from 'react';

import { cn } from '@lilog/ui';
import { ArrowDown, ArrowUp } from 'lucide-react';

import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  ALL_ORDEM_IMPRESSAO_ITEMS,
  ORDEM_IMPRESSAO_LABELS,
  type OrdemImpressaoContext,
  type OrdemImpressaoItem,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { sectionLabelClassName } from '@/features/expedicao-impressao-config/components/panel-styles';

type OrdemImpressaoPanelProps = {
  ordemSeparacao: OrdemImpressaoItem[];
  ordemConferencia: OrdemImpressaoItem[];
  ordemConferenciaReentrega: OrdemImpressaoItem[];
  onMoveUp: (context: OrdemImpressaoContext, index: number) => void;
  onMoveDown: (context: OrdemImpressaoContext, index: number) => void;
  onToggle: (context: OrdemImpressaoContext, item: OrdemImpressaoItem) => void;
};

const TABS: { id: OrdemImpressaoContext; label: string }[] = [
  { id: 'separacao', label: 'Separação' },
  { id: 'conferencia', label: 'Conferência' },
  { id: 'conferencia_reentrega', label: 'Reentrega' },
];

function OrdemList({
  ordem,
  context,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  ordem: OrdemImpressaoItem[];
  context: OrdemImpressaoContext;
  onMoveUp: (context: OrdemImpressaoContext, index: number) => void;
  onMoveDown: (context: OrdemImpressaoContext, index: number) => void;
  onToggle: (context: OrdemImpressaoContext, item: OrdemImpressaoItem) => void;
}) {
  const inactiveItems = ALL_ORDEM_IMPRESSAO_ITEMS.filter(
    (item) => !ordem.includes(item),
  );

  return (
    <div className="space-y-2.5">
      <p className={sectionLabelClassName}>Campos visíveis na impressão</p>
      <div className="space-y-1">
        {ordem.length === 0 ? (
          <p className="rounded-md border border-dashed border-outline-variant/60 px-2 py-3 text-center text-[10px] text-muted-foreground">
            Selecione ao menos um campo abaixo.
          </p>
        ) : (
          ordem.map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface-low/30 px-2 py-1.5"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary-container text-[10px] font-bold text-on-primary-container">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              {ORDEM_IMPRESSAO_LABELS[item]}
            </span>
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => onMoveUp(context, index)}
                disabled={index === 0}
                aria-label={`Mover ${ORDEM_IMPRESSAO_LABELS[item]} para cima`}
                className={cn(
                  'flex size-6 items-center justify-center rounded border border-outline-variant transition-colors',
                  index === 0
                    ? 'cursor-not-allowed opacity-30'
                    : 'hover:border-primary hover:bg-primary/5',
                )}
              >
                <ArrowUp className="size-3" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(context, index)}
                disabled={index === ordem.length - 1}
                aria-label={`Mover ${ORDEM_IMPRESSAO_LABELS[item]} para baixo`}
                className={cn(
                  'flex size-6 items-center justify-center rounded border border-outline-variant transition-colors',
                  index === ordem.length - 1
                    ? 'cursor-not-allowed opacity-30'
                    : 'hover:border-primary hover:bg-primary/5',
                )}
              >
                <ArrowDown className="size-3" aria-hidden />
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      <div>
        <p className={cn(sectionLabelClassName, 'mb-1.5')}>
          Exibir / ocultar campos
        </p>
        <div className="flex flex-wrap gap-1">
          {ALL_ORDEM_IMPRESSAO_ITEMS.map((item) => {
            const isActive = ordem.includes(item);

            return (
              <button
                key={item}
                type="button"
                onClick={() => onToggle(context, item)}
                aria-pressed={isActive}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-outline-variant/60 text-muted-foreground hover:border-primary/30',
                )}
              >
                {ORDEM_IMPRESSAO_LABELS[item]}
              </button>
            );
          })}
        </div>
        {inactiveItems.length > 0 && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Ocultos:{' '}
            {inactiveItems.map((item) => ORDEM_IMPRESSAO_LABELS[item]).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

export function OrdemImpressaoPanel({
  ordemSeparacao,
  ordemConferencia,
  ordemConferenciaReentrega,
  onMoveUp,
  onMoveDown,
  onToggle,
}: OrdemImpressaoPanelProps) {
  const [activeTab, setActiveTab] = useState<OrdemImpressaoContext>('separacao');
  const activeOrdem =
    activeTab === 'separacao'
      ? ordemSeparacao
      : activeTab === 'conferencia'
        ? ordemConferencia
        : ordemConferenciaReentrega;

  return (
    <div className="space-y-2.5">
      <div className={segmentGroupClassName}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={segmentButtonClassName(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <OrdemList
        ordem={activeOrdem}
        context={activeTab}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onToggle={onToggle}
      />

      {activeOrdem.length > 0 && (
        <p className="truncate text-[10px] text-muted-foreground">
          Ordem:{' '}
          {activeOrdem
            .map((item, index) => `${index + 1}º ${ORDEM_IMPRESSAO_LABELS[item]}`)
            .join(' → ')}
        </p>
      )}
    </div>
  );
}
