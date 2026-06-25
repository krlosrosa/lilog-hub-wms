'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { CancelarCorteModal } from '@/features/corte-operacional/components/cancelar-corte-modal';
import { CorteStatusBadge } from '@/features/corte-operacional/components/corte-status-badge';
import { useCorteOperacionalDetalhe } from '@/features/corte-operacional/hooks/use-corte-operacional-detalhe';

type CorteOperacionalDetalheViewProps = {
  corteId: string;
};

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

export function CorteOperacionalDetalheView({
  corteId,
}: CorteOperacionalDetalheViewProps) {
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const { corte, carregando, processando, erro, iniciar, realizar, cancelar } =
    useCorteOperacionalDetalhe(corteId);

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link href="/expedicao/corte-operacional">
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Link>
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                  {corte?.codigo ?? 'Corte operacional'}
                </h1>
                {corte ? (
                  <p className="mt-1 text-body-md text-muted-foreground">
                    {corte.mapaGrupoTitulo} · {corte.rota}
                  </p>
                ) : null}
              </div>
              {corte ? <CorteStatusBadge status={corte.status} /> : null}
            </div>
          </header>

          {carregando ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando…
            </div>
          ) : erro ? (
            <p className="py-16 text-center text-sm text-destructive">{erro}</p>
          ) : corte ? (
            <>
              <div className="grid gap-4 rounded-xl border border-outline-variant/50 bg-glass-bg p-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Mapa
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {corte.mapaGrupoMicroUuid}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Doca
                  </p>
                  <p className="text-sm text-foreground">{corte.doca ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Volumes / Peso
                  </p>
                  <p className="text-sm text-foreground">
                    {corte.totalVolumes ?? '—'} vol. ·{' '}
                    {corte.pesoTotalKg != null
                      ? `${corte.pesoTotalKg.toLocaleString('pt-BR')} kg`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Solicitado
                  </p>
                  <p className="text-sm text-foreground">
                    {corte.solicitadoPorNome ?? '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatarData(corte.solicitadoEm)}
                  </p>
                </div>
              </div>

              {corte.motivo || corte.observacao ? (
                <div className="rounded-xl border border-outline-variant/50 bg-surface-low p-4 text-sm">
                  {corte.motivo ? (
                    <p>
                      <span className="font-semibold">Motivo:</span>{' '}
                      {corte.motivo}
                    </p>
                  ) : null}
                  {corte.observacao ? (
                    <p className={corte.motivo ? 'mt-2' : undefined}>
                      <span className="font-semibold">Observação:</span>{' '}
                      {corte.observacao}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                <div className="border-b border-outline-variant px-4 py-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Itens do corte
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-surface-highest/50">
                        <th className="px-3 py-2 font-semibold text-muted-foreground">
                          SKU
                        </th>
                        <th className="px-3 py-2 font-semibold text-muted-foreground">
                          Remessa
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                          Qtd. mapa
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">
                          Qtd. corte
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {corte.itens.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-mono text-foreground">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-foreground">
                            {item.remessa}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                            {item.quantidadeMapa} {item.unidadeMedida}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums font-semibold text-foreground">
                            {item.quantidadeCorte} {item.unidadeMedida}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {corte.status === 'cancelado' && corte.motivoCancelamento ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <span className="font-semibold">Motivo do cancelamento:</span>{' '}
                  {corte.motivoCancelamento}
                </div>
              ) : null}

              {corte.status === 'concluido' ? (
                <p className="text-sm text-muted-foreground">
                  Concluído por {corte.realizadoPorNome ?? '—'} em{' '}
                  {formatarData(corte.realizadoEm)}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {corte.status === 'solicitado' ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => void iniciar()}
                      disabled={processando}
                    >
                      Iniciar realização
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalCancelarAberto(true)}
                      disabled={processando}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
                {corte.status === 'em_andamento' ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => void realizar()}
                      disabled={processando}
                    >
                      Concluir corte
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalCancelarAberto(true)}
                      disabled={processando}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </main>

      <CancelarCorteModal
        open={modalCancelarAberto}
        processando={processando}
        onClose={() => setModalCancelarAberto(false)}
        onConfirm={cancelar}
      />
    </SidebarMain>
  );
}
