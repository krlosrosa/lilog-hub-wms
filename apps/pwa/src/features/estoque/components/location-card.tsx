import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Layers,
  Package,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  Zap,
} from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import {
  TIPO_ESTOQUE_LABELS,
  type Localizacao,
} from '../types/consulta-produto.schema';
import { QuantidadeBadge } from './quantidade-badge';

interface LocationCardProps {
  localizacao: Localizacao;
  unidade?: string;
  onSolicitarRessuprimento?: (localizacao: Localizacao) => void;
  onSolicitarPrioridade?: (localizacao: Localizacao) => void;
}

const TIPO_STYLES = {
  picking: {
    border: 'border-l-secondary',
    iconBox: 'bg-secondary/10 text-secondary',
    badge: 'bg-secondary-container text-on-secondary-container',
    Icon: ShoppingCart,
  },
  aereo: {
    border: 'border-l-tertiary',
    iconBox: 'bg-tertiary/10 text-tertiary',
    badge: 'bg-surface-container-high text-on-surface',
    Icon: Layers,
  },
} as const;

export function LocationCard({
  localizacao,
  unidade = 'CX',
  onSolicitarRessuprimento,
  onSolicitarPrioridade,
}: LocationCardProps) {
  const isCritico = localizacao.status === 'critico';
  const tipoStyle = TIPO_STYLES[localizacao.tipo];
  const TipoIcon = tipoStyle.Icon;
  const ressuprimentoEmAndamento =
    localizacao.tipo === 'picking' && localizacao.ordemRessuprimento != null;
  const ordem = localizacao.ordemRessuprimento;
  const podeSolicitarRessuprimento =
    localizacao.tipo === 'picking' && !ressuprimentoEmAndamento;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-outline-variant bg-surface p-3 shadow-sm',
        'border-l-[3px]',
        isCritico ? 'border-l-destructive bg-destructive/[0.04]' : tipoStyle.border,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isCritico ? 'bg-destructive/10 text-destructive' : tipoStyle.iconBox,
          )}
        >
          <TipoIcon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-mono text-label-md font-bold text-on-surface">
              {localizacao.endereco}
            </span>
            <QuantidadeBadge
              value={localizacao.quantidade}
              unidade={unidade}
              variant={
                isCritico ? 'critico' : localizacao.tipo === 'aereo' ? 'aereo' : 'default'
              }
            />
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase',
                isCritico ? 'bg-destructive text-destructive-foreground' : tipoStyle.badge,
              )}
            >
              {!isCritico && <TipoIcon className="h-2.5 w-2.5" aria-hidden />}
              {isCritico ? localizacao.zona : TIPO_ESTOQUE_LABELS[localizacao.tipo]}
            </span>

            {!isCritico && (
              <span className="truncate text-[10px] text-on-surface-variant">
                {localizacao.zona}
              </span>
            )}

            {localizacao.alertaLabel ? (
              <span className="inline-flex items-center gap-0.5 truncate text-[10px] font-medium text-destructive">
                <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {localizacao.alertaLabel}
              </span>
            ) : localizacao.lote ? (
              <span className="inline-flex min-w-0 items-center gap-0.5 truncate text-[10px] text-on-surface-variant">
                <Package className="h-2.5 w-2.5 shrink-0 text-outline" aria-hidden />
                Lote {localizacao.lote}
              </span>
            ) : null}
          </div>
        </div>

        {isCritico && !ressuprimentoEmAndamento ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
        ) : null}
      </div>

      {ressuprimentoEmAndamento && ordem && onSolicitarPrioridade && (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onSolicitarPrioridade(localizacao);
          }}
          className={cn(
            'mt-2 flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left',
            'touch-manipulation transition-all active:scale-[0.99]',
            ordem.prioridadeSolicitada
              ? 'border-secondary/50 bg-secondary/15 active:bg-secondary/20'
              : 'border-secondary/30 bg-secondary/10 active:bg-secondary/15',
          )}
          aria-label={
            ordem.prioridadeSolicitada
              ? `Prioridade já solicitada para ${ordem.ordemId}, toque para detalhes`
              : `Ressuprimento em andamento ${ordem.ordemId}, toque para solicitar prioridade`
          }
        >
          {ordem.prioridadeSolicitada ? (
            <Zap className="h-3 w-3 shrink-0 fill-secondary text-secondary" aria-hidden />
          ) : (
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-secondary" aria-hidden />
          )}
          <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-secondary">
            {ordem.prioridadeSolicitada
              ? 'Prioridade solicitada'
              : 'Ressuprimento em andamento'}
          </span>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-on-surface-variant">
            {ordem.ordemId}
          </span>
          <span className="shrink-0 text-[10px] font-semibold text-secondary">Palete</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-outline" aria-hidden />
        </button>
      )}

      {podeSolicitarRessuprimento && onSolicitarRessuprimento && (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onSolicitarRessuprimento(localizacao);
          }}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1.5',
            'border border-secondary/25 bg-secondary/5 text-[10px] font-semibold text-secondary',
            'touch-manipulation transition-colors active:bg-secondary/15 active:scale-[0.99]',
            isCritico && 'border-destructive/25 bg-destructive/5 text-destructive active:bg-destructive/10',
          )}
          aria-label={`Solicitar ressuprimento em ${localizacao.endereco}`}
        >
          <PackagePlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Solicitar ressuprimento
        </button>
      )}
    </article>
  );
}
