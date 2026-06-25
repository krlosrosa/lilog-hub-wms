'use client';

import Link from 'next/link';

import { Loader2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import { SessaoAcoesBar } from '@/features/sessao-operacao/components/sessao-acoes-bar';
import { SessaoPresencaTable } from '@/features/sessao-operacao/components/sessao-presenca-table';
import { SessaoStatusBadge } from '@/features/sessao-operacao/components/sessao-status-badge';
import { useSessaoDetalhe } from '@/features/sessao-operacao/hooks/use-sessao-detalhe';
import {
  formatDataReferencia,
  formatDateTime,
} from '@/features/sessao-operacao/types/sessao.schema';
import { formatHorarioIntervalo } from '@/features/sessao-operacao/types/escala.schema';

type SessaoDetalheViewProps = {
  sessaoId: string;
};

export function SessaoDetalheView({ sessaoId }: SessaoDetalheViewProps) {
  const {
    sessao,
    funcionarios,
    pendentesCount,
    isLoading,
    isSubmitting,
    handleAbrir,
    handleEncerrar,
    handleCancelar,
    atualizarPresenca,
  } = useSessaoDetalhe(sessaoId);

  return (
    <SidebarMain>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div>
          <Link
            href="/sessao-operacao/sessoes"
            className="text-body-sm text-primary hover:underline"
          >
            ← Voltar para sessões
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !sessao ? (
          <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-body-sm text-muted-foreground">
            Sessão não encontrada.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <SessaoStatusBadge status={sessao.status} />
                  {sessao.cruzaMeiaNoite && <EscalaTurnoBadge cruzaMeiaNoite />}
                </div>
                <h1 className="text-headline-sm font-bold text-foreground">
                  {sessao.escalaNome}
                </h1>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {sessao.equipeNome} ·{' '}
                  {formatDataReferencia(sessao.dataReferencia)} ·{' '}
                  {formatHorarioIntervalo(
                    sessao.horaInicioPlanejada,
                    sessao.horaFimPlanejada,
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Início planejado"
                value={formatDateTime(sessao.inicioPlanejado)}
              />
              <InfoCard
                label="Fim planejado"
                value={formatDateTime(sessao.fimPlanejado)}
              />
              <InfoCard
                label="Início real"
                value={formatDateTime(sessao.inicioReal)}
              />
              <InfoCard
                label="Fim real"
                value={formatDateTime(sessao.fimReal)}
              />
            </div>

            <div>
              <h2 className="mb-3 text-body-md font-semibold text-foreground">
                Presença ({funcionarios.length})
              </h2>
              <SessaoPresencaTable
                funcionarios={funcionarios}
                editavel={sessao.status === 'aberta'}
                isSubmitting={isSubmitting}
                onAtualizarPresenca={(id, status) =>
                  void atualizarPresenca(id, status)
                }
              />
            </div>

            <SessaoAcoesBar
              sessao={sessao}
              isSubmitting={isSubmitting}
              pendentesCount={pendentesCount}
              onAbrir={() => void handleAbrir()}
              onEncerrar={() => void handleEncerrar()}
              onCancelar={() => void handleCancelar()}
            />
          </>
        )}
      </div>
    </SidebarMain>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 text-body-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
