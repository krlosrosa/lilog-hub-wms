'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Package,
  Truck,
  Unlock,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import type { DemandaRecebimentoRecursoApi } from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function StatusBadgeDemanda({
  status,
}: {
  status: DemandaRecebimentoRecursoApi['statusDemanda'];
}) {
  if (status === 'disponivel') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-semibold uppercase text-error">
        Sem conferente
      </span>
    );
  }

  if (status === 'atribuida') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-primary-container">
        Atribuída
      </span>
    );
  }

  if (status === 'impedido') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-600">
        <AlertTriangle className="size-2.5" aria-hidden />
        Impedido
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
      <CheckCircle2 className="size-2.5" aria-hidden />
      Em conferência
    </span>
  );
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  return `há ${hours}h${minutes % 60 > 0 ? `${minutes % 60}min` : ''}`;
}

function formatHora(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_ACCENT: Record<
  DemandaRecebimentoRecursoApi['statusDemanda'],
  string
> = {
  disponivel: 'bg-error',
  atribuida: 'bg-primary',
  em_conferencia: 'bg-secondary',
  impedido: 'bg-orange-500',
};

const EMPRESA_STYLES: Record<string, string> = {
  LDB: 'bg-blue-500/15 text-blue-700',
  ITB: 'bg-emerald-500/15 text-emerald-700',
  DPA: 'bg-violet-500/15 text-violet-700',
};

const CATEGORIA_STYLES: Record<string, string> = {
  seco: 'bg-amber-500/15 text-amber-700',
  refrigerado: 'bg-cyan-500/15 text-cyan-700',
  queijo: 'bg-orange-500/15 text-orange-700',
};

const CATEGORIA_LABELS: Record<string, string> = {
  seco: 'Seco',
  refrigerado: 'Refrigerado',
  queijo: 'Queijo',
};

function EmpresaBadge({ empresa }: { empresa: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
        EMPRESA_STYLES[empresa] ?? 'bg-surface-container text-on-surface-variant',
      )}
    >
      {empresa}
    </span>
  );
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        CATEGORIA_STYLES[categoria] ?? 'bg-surface-container text-on-surface-variant',
      )}
    >
      {CATEGORIA_LABELS[categoria] ?? categoria}
    </span>
  );
}

type DemandaRecebimentoCardProps = {
  demanda: DemandaRecebimentoRecursoApi;
  onAtribuir?: (preRecebimentoId: string) => void;
  onCancelar?: (alocacaoId: string) => void;
  onAdicionarApoio?: (preRecebimentoId: string) => void;
  onRemoverApoio?: (apoioId: string) => void;
  onLiberarImpedimento?: (preRecebimentoId: string) => void;
  onVerImpedimento?: (demanda: DemandaRecebimentoRecursoApi) => void;
  isAtribuindo?: boolean;
  isCancelando?: boolean;
  isAdicionandoApoio?: boolean;
  isRemovendoApoio?: boolean;
  isLiberando?: boolean;
};

export function DemandaRecebimentoCard({
  demanda,
  onAtribuir,
  onCancelar,
  onAdicionarApoio,
  onRemoverApoio,
  onLiberarImpedimento,
  onVerImpedimento,
  isAtribuindo,
  isCancelando,
  isAdicionandoApoio,
  isRemovendoApoio,
  isLiberando,
}: DemandaRecebimentoCardProps) {
  const { statusDemanda, alocacao, conferente, apoios } = demanda;
  const isDisponivel = statusDemanda === 'disponivel';
  const isAtribuida = statusDemanda === 'atribuida';
  const isEmConferencia = statusDemanda === 'em_conferencia';
  const isImpedido = statusDemanda === 'impedido';

  const conferenteNome = alocacao?.funcionarioNome ?? conferente?.nome;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-surface shadow-sm',
        isDisponivel
          ? 'border-error/25'
          : isAtribuida
            ? 'border-primary/25'
            : isImpedido
              ? 'border-orange-500/25'
              : 'border-outline-variant',
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          STATUS_ACCENT[statusDemanda],
        )}
        aria-hidden
      />

      <div className="px-3.5 py-3.5 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                isDisponivel
                  ? 'bg-error-container text-error'
                  : isAtribuida
                    ? 'bg-primary-container text-on-primary-container'
                    : isImpedido
                      ? 'bg-orange-500/15 text-orange-600'
                      : 'bg-secondary-container text-on-secondary-container',
              )}
            >
              <Truck className="size-4" aria-hidden />
            </div>

            <div className="min-w-0">
              <p className="truncate text-label-md font-semibold text-on-surface">
                {demanda.placa ?? 'Placa não informada'}
              </p>
              {demanda.transportadoraNome ? (
                <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
                  {demanda.transportadoraNome}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {demanda.dock ? (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-surface-container px-2 py-1 text-[10px] font-bold uppercase text-on-surface">
                <MapPin className="size-2.5 text-secondary" aria-hidden />
                Doca {demanda.dock}
              </span>
            ) : null}
            <StatusBadgeDemanda status={statusDemanda} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 text-[11px] text-on-surface-variant">
            <Clock className="size-3 text-secondary" aria-hidden />
            Previsto {formatHora(demanda.horarioPrevisto)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 text-[11px] text-on-surface-variant">
            <Package className="size-3 text-secondary" aria-hidden />
            {demanda.skuCount} SKUs
          </span>
        </div>

        {demanda.empresas.length > 0 || demanda.categorias.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {demanda.empresas.map((empresa) => (
              <EmpresaBadge key={empresa} empresa={empresa} />
            ))}
            {demanda.categorias.map((categoria) => (
              <CategoriaBadge key={categoria} categoria={categoria} />
            ))}
          </div>
        ) : null}

        {isImpedido ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-2">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-orange-600"
                aria-hidden
              />
              <p className="text-[11px] text-on-surface-variant">
                Conferência suspensa por impedimento. Veja o motivo e as fotos
                antes de liberar.
              </p>
            </div>

            {onVerImpedimento ? (
              <button
                type="button"
                onClick={() => onVerImpedimento(demanda)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 bg-surface py-2.5 text-label-sm font-semibold text-orange-700 transition-colors active:bg-orange-500/5"
              >
                <Eye className="size-3.5" aria-hidden />
                Ver motivo e fotos
              </button>
            ) : null}
          </div>
        ) : null}

        {isAtribuida && alocacao ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-primary/15 bg-primary-container/20 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-semibold text-on-primary-container">
                {getInitials(alocacao.funcionarioNome)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-label-sm font-semibold text-on-surface">
                  {alocacao.funcionarioNome}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Atribuído {formatRelativeTime(alocacao.atribuidoEm)}
                </p>
              </div>
            </div>
            {onCancelar ? (
              <button
                type="button"
                disabled={isCancelando}
                onClick={() => onCancelar(alocacao.id)}
                className="shrink-0 rounded-full p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container active:bg-surface-container-high disabled:opacity-50"
                aria-label="Cancelar atribuição"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}

        {isEmConferencia && conferenteNome ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-secondary/15 bg-secondary-container/15 px-2.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[11px] font-semibold text-on-secondary-container">
                {getInitials(conferenteNome)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-label-sm font-semibold text-on-surface">
                  {conferenteNome}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Responsável
                  {demanda.recebimentoDataInicio
                    ? ` · ${formatRelativeTime(demanda.recebimentoDataInicio)}`
                    : ''}
                </p>
              </div>
            </div>

            {apoios.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {apoios.map((apoio) => (
                  <span
                    key={apoio.id}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 text-[10px] font-medium text-on-surface-variant"
                  >
                    <Users className="size-2.5 text-secondary" aria-hidden />
                    {apoio.funcionarioNome}
                    {onRemoverApoio ? (
                      <button
                        type="button"
                        disabled={isRemovendoApoio}
                        onClick={() => onRemoverApoio(apoio.id)}
                        className="rounded-full p-0.5 hover:bg-surface-container-high disabled:opacity-50"
                        aria-label={`Remover apoio ${apoio.funcionarioNome}`}
                      >
                        <X className="size-2.5" aria-hidden />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}

            {onAdicionarApoio ? (
              <button
                type="button"
                disabled={isAdicionandoApoio}
                onClick={() => onAdicionarApoio(demanda.preRecebimentoId)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface py-2 text-label-sm font-semibold text-on-surface transition-colors disabled:opacity-50 active:bg-surface-container"
              >
                <UserPlus className="size-3.5" aria-hidden />
                {isAdicionandoApoio ? 'Adicionando...' : 'Adicionar apoio'}
              </button>
            ) : null}
          </div>
        ) : null}

        {isImpedido && onLiberarImpedimento && !onVerImpedimento ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={isLiberando}
              onClick={() => onLiberarImpedimento(demanda.preRecebimentoId)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-label-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 active:opacity-80"
            >
              <Unlock className="size-3.5" aria-hidden />
              {isLiberando ? 'Liberando...' : 'Liberar para conferência'}
            </button>
          </div>
        ) : null}

        {isDisponivel && onAtribuir ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={isAtribuindo}
              onClick={() => onAtribuir(demanda.preRecebimentoId)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-label-sm font-semibold text-on-primary shadow-sm transition-opacity disabled:opacity-50 active:opacity-80"
            >
              <UserPlus className="size-3.5" aria-hidden />
              {isAtribuindo ? 'Atribuindo...' : 'Atribuir conferente'}
            </button>
          </div>
        ) : null}

        {isAtribuida && onAtribuir ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={isAtribuindo}
              onClick={() => onAtribuir(demanda.preRecebimentoId)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface py-2.5 text-label-sm font-semibold text-on-surface transition-colors disabled:opacity-50 active:bg-surface-container"
            >
              <UserPlus className="size-3.5" aria-hidden />
              {isAtribuindo ? 'Reatribuindo...' : 'Reatribuir conferente'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
