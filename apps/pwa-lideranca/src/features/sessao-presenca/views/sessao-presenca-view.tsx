import { Loader2, Search } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { FeatureToastPortal } from '../components/feature-toast';
import { PresencaFilterChips } from '../components/presenca-filter-chips';
import { PresencaFuncionarioCard } from '../components/presenca-funcionario-card';
import { PresencaSummaryHero } from '../components/presenca-summary-hero';
import { SessaoBottomDock } from '../components/sessao-bottom-dock';
import { SessaoSubHeader } from '../components/sessao-sub-header';
import { useSessaoPresenca } from '../hooks/use-sessao-presenca';
import {
  formatHorarioIntervalo,
  SESSAO_STATUS_LABELS,
} from '../lib/sessao-labels';

export interface SessaoPresencaViewProps {
  sessaoId: string;
}

export function SessaoPresencaView({ sessaoId }: SessaoPresencaViewProps) {
  const { state, actions } = useSessaoPresenca(sessaoId);
  const {
    sessao,
    funcionarios,
    stats,
    busca,
    filtro,
    isLoading,
    isSubmitting,
    updatingIds,
    editavel,
    toast,
  } = state;

  return (
    <div className="page-enter flex flex-col pb-28">
      <FeatureToastPortal toast={toast} />

      <SessaoSubHeader
        backTo="/sessao-presenca"
        backLabel="Voltar para sessões"
        title={sessao?.escalaNome ?? 'Sessão'}
        subtitle={
          sessao
            ? `${sessao.equipeNome} · ${SESSAO_STATUS_LABELS[sessao.status]}`
            : undefined
        }
        trailing={
          sessao ? (
            <div className="text-right">
              <p className="font-mono text-label-md font-bold tabular-nums text-secondary">
                {stats.presentes}/{stats.total}
              </p>
              <p className="text-label-sm text-on-surface-variant">presentes</p>
            </div>
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden />
        </div>
      ) : !sessao ? (
        <div className="mx-margin-mobile mt-4 rounded-lg border border-dashed border-outline-variant p-8 text-center text-body-sm text-on-surface-variant">
          Sessão não encontrada.
        </div>
      ) : (
        <div className="space-y-4 px-margin-mobile pt-3">
          <p className="text-label-sm text-on-surface-variant">
            {formatHorarioIntervalo(
              sessao.horaInicioPlanejada,
              sessao.horaFimPlanejada,
            )}
            {sessao.cruzaMeiaNoite ? ' · Turno noturno' : ''}
          </p>

          <PresencaSummaryHero
            stats={stats}
            escalaNome={sessao.escalaNome}
            equipeNome={sessao.equipeNome}
          />

          {editavel ? (
            <>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => actions.setBusca(e.target.value)}
                  placeholder="Buscar por nome ou matrícula..."
                  className="h-11 w-full rounded-lg border border-outline-variant bg-surface py-2 pl-10 pr-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/60"
                />
              </div>

              <PresencaFilterChips
                filtro={filtro}
                stats={stats}
                onChange={(next) => {
                  hapticLight();
                  actions.setFiltro(next);
                }}
              />
            </>
          ) : (
            <p className="rounded-lg bg-surface-container px-3 py-2 text-center text-label-sm text-on-surface-variant">
              Sessão {SESSAO_STATUS_LABELS[sessao.status].toLowerCase()} — somente
              leitura
            </p>
          )}

          <div className="space-y-3">
            {funcionarios.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
                Nenhum funcionário neste filtro.
              </div>
            ) : (
              funcionarios.map((funcionario) => (
                <PresencaFuncionarioCard
                  key={funcionario.id}
                  funcionario={funcionario}
                  editavel={editavel}
                  isUpdating={updatingIds.has(funcionario.funcionarioId)}
                  onAtualizar={(id, status, obs) =>
                    void actions.atualizarPresenca(id, status, obs)
                  }
                />
              ))
            )}
          </div>
        </div>
      )}

      <SessaoBottomDock
        status={sessao?.status ?? null}
        isSubmitting={isSubmitting}
        pendentesCount={stats.pendentes}
        onAbrir={() => void actions.handleAbrir()}
        onEncerrar={() => void actions.handleEncerrar()}
      />
    </div>
  );
}
