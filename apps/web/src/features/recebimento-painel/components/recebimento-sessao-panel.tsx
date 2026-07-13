'use client';

import {
  ArrowUpRight,
  ClipboardCheck,
  Coffee,
  PauseCircle,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@lilog/ui';

import { DashboardChartPanel } from '@/features/dashboard-operacional/components/dashboard-charts';
import type {
  SessaoOperacionalPainel,
  SessaoOperadorPainel,
  SessaoStatusOperacionalPainel,
} from '@/features/recebimento-painel/types/recebimento-painel.schema';

const STATUS_OPERACIONAL_LABELS: Record<SessaoStatusOperacionalPainel, string> = {
  atuando: 'Atuando',
  disponivel: 'Disponível',
  em_pausa: 'Em pausa',
  indisponivel: 'Indisponível',
};

const STATUS_OPERACIONAL_STYLES: Record<SessaoStatusOperacionalPainel, string> = {
  atuando: 'bg-tertiary/15 text-tertiary',
  disponivel: 'bg-amber-500/15 text-amber-400',
  em_pausa: 'bg-sky-500/15 text-sky-400',
  indisponivel: 'bg-white/5 text-white/35',
};

const GRUPOS_OPERADORES: Array<{
  id: SessaoStatusOperacionalPainel;
  label: string;
  icon: typeof Zap;
}> = [
  { id: 'atuando', label: 'Atuando', icon: Zap },
  { id: 'disponivel', label: 'Disponíveis', icon: UserCheck },
  { id: 'em_pausa', label: 'Em pausa', icon: Coffee },
];

function OperadorItem({
  operador,
  compact,
}: {
  operador: SessaoOperadorPainel;
  compact: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-md bg-black/20 px-2 py-1">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-white/90">
          <span className="inline-flex min-w-0 items-center gap-1">
            {operador.tipoVinculo === 'apoio' ? (
              <UserPlus
                className="size-2.5 shrink-0 text-tertiary"
                aria-label="Apoio"
              />
            ) : null}
            <span className="truncate">{operador.nome}</span>
          </span>
          {operador.precisaPausa ? (
            <span className="ml-1 text-[8px] font-semibold uppercase text-amber-400">
              · pausa
            </span>
          ) : null}
        </p>
        <p className="truncate text-[9px] text-white/35">
          {operador.cargo}
          {operador.atividade ? ` · ${operador.atividade}` : ''}
        </p>
        {!compact && operador.placaAtual ? (
          <p className="truncate text-[8px] text-white/25">
            {operador.placaAtual}
            {operador.docaAtual ? ` · ${operador.docaAtual}` : ''}
          </p>
        ) : null}
      </div>
      <span
        className={cn(
          'shrink-0 rounded px-1.5 py-px text-[8px] font-semibold uppercase',
          STATUS_OPERACIONAL_STYLES[operador.statusOperacional],
        )}
      >
        {STATUS_OPERACIONAL_LABELS[operador.statusOperacional]}
      </span>
    </li>
  );
}

function GrupoOperadores({
  label,
  icon: Icon,
  operadores,
  compact,
  limite,
}: {
  label: string;
  icon: typeof Zap;
  operadores: SessaoOperadorPainel[];
  compact: boolean;
  limite: number;
}) {
  if (operadores.length === 0) return null;

  const visiveis = operadores.slice(0, limite);
  const restantes = operadores.length - visiveis.length;

  return (
    <div className="min-h-0">
      <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/40">
        <Icon className="size-2.5" aria-hidden />
        {label}
        <span className="rounded bg-white/10 px-1 py-px text-[8px] tabular-nums text-white/50">
          {operadores.length}
        </span>
      </p>
      <ul className="space-y-1">
        {visiveis.map((operador) => (
          <OperadorItem key={operador.id} operador={operador} compact={compact} />
        ))}
      </ul>
      {restantes > 0 ? (
        <p className="mt-1 text-center text-[9px] text-white/30">
          +{restantes} operadores
        </p>
      ) : null}
    </div>
  );
}

export function RecebimentoSessaoPanel({
  sessao,
  className,
  compact = false,
}: {
  sessao: SessaoOperacionalPainel;
  className?: string;
  compact?: boolean;
}) {
  const { presenca } = sessao;
  const pctPresentes =
    presenca.esperados > 0
      ? Math.round((presenca.presentes / presenca.esperados) * 100)
      : 0;

  const limitePorGrupo = compact ? 2 : 4;

  const operadoresPorGrupo = GRUPOS_OPERADORES.map((grupo) => ({
    ...grupo,
    operadores: sessao.operadores.filter(
      (operador) => operador.statusOperacional === grupo.id,
    ),
  }));

  const temGrupos = operadoresPorGrupo.some((grupo) => grupo.operadores.length > 0);

  if (sessao.semSessaoAtiva) {
    return (
      <DashboardChartPanel
        titulo="Sessão Operacional"
        descricao="Nenhuma sessão aberta no período"
        icon={Users}
        className={cn('min-h-0', className)}
        bodyClassName={cn('flex min-h-0 flex-col items-center justify-center gap-2 p-4')}
      >
        <Users className="size-8 text-white/15" aria-hidden />
        <p className="text-center text-xs text-white/50">
          Abra uma sessão de recebimento para acompanhar equipe e alocações em tempo real.
        </p>
      </DashboardChartPanel>
    );
  }

  return (
    <DashboardChartPanel
      titulo="Sessão Operacional"
      descricao={`${sessao.equipeNome} · ${sessao.escalaNome}`}
      icon={Users}
      className={cn('min-h-0', className)}
      bodyClassName={cn('flex min-h-0 flex-col gap-1.5', compact ? 'p-1.5' : 'gap-2 p-2')}
    >
      {sessao.gestaoRecursosPath ? (
        <div className="flex shrink-0 justify-end">
          <Link
            href={sessao.gestaoRecursosPath}
            className="inline-flex items-center gap-0.5 text-[9px] font-medium text-tertiary hover:text-tertiary/80"
          >
            Gestão de recursos
            <ArrowUpRight className="size-2.5" aria-hidden />
          </Link>
        </div>
      ) : null}
      <div className="flex shrink-0 items-center justify-between gap-2 rounded-md border border-white/8 bg-black/20 px-2 py-1.5">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-white/35">
            Equipe presente
          </p>
          <p className="text-lg font-bold tabular-nums text-white">
            {presenca.presentes}
            <span className="text-sm font-normal text-white/40">
              /{presenca.esperados}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-white/35">
            Horário
          </p>
          <p className="text-xs font-semibold tabular-nums text-white/80">
            {sessao.horaInicio} – {sessao.horaFim}
          </p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-1">
        {[
          { label: 'Atuando', value: sessao.atuando, icon: Zap },
          { label: 'Disponíveis', value: sessao.ociosos, icon: UserCheck },
          { label: 'Pausa', value: sessao.emPausa, icon: PauseCircle },
          { label: 'Apoio', value: sessao.apoiosTotal, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-md border border-white/8 bg-black/15 px-1 py-1 text-center"
          >
            <Icon className="mx-auto size-3 text-white/30" aria-hidden />
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {value}
            </p>
            <p className="text-[7px] uppercase tracking-wide text-white/30">
              {label}
            </p>
          </div>
        ))}
      </div>

      {sessao.precisamPausa > 0 ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1">
          <Coffee className="size-3 shrink-0 text-amber-400" aria-hidden />
          <p className="text-[9px] text-amber-300">
            {sessao.precisamPausa} operador
            {sessao.precisamPausa > 1 ? 'es' : ''} precisa
            {sessao.precisamPausa > 1 ? 'm' : ''} de pausa
          </p>
        </div>
      ) : null}

      <div className="shrink-0">
        <div className="mb-1 flex items-center justify-between text-[9px] text-white/40">
          <span>Presença</span>
          <span className="flex items-center gap-2">
            <span className="text-white/30">
              Faltas {presenca.faltas} · Atrasos {presenca.atrasos}
            </span>
            <span>{pctPresentes}%</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-tertiary transition-all"
            style={{ width: `${pctPresentes}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {temGrupos ? (
          operadoresPorGrupo.map((grupo) => (
            <GrupoOperadores
              key={grupo.id}
              label={grupo.label}
              icon={grupo.icon}
              operadores={grupo.operadores}
              compact={compact}
              limite={limitePorGrupo}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-4 text-center">
            <UserMinus className="size-5 text-white/20" aria-hidden />
            <p className="text-[10px] text-white/40">
              Nenhum operador alocado na sessão
            </p>
          </div>
        )}
      </div>
    </DashboardChartPanel>
  );
}
