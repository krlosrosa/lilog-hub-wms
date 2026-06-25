'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { CorteBipInput } from '@/features/corte-operacional/components/corte-bip-input';
import { CorteItensSelecaoTable } from '@/features/corte-operacional/components/corte-itens-selecao-table';
import { CorteMapaResumo } from '@/features/corte-operacional/components/corte-mapa-resumo';
import { useSolicitarCorteOperacional } from '@/features/corte-operacional/hooks/use-solicitar-corte-operacional';

export function CorteOperacionalNovaView() {
  const router = useRouter();
  const {
    codigoBip,
    setCodigoBip,
    mapa,
    selecao,
    doca,
    setDoca,
    motivo,
    setMotivo,
    observacao,
    setObservacao,
    buscando,
    enviando,
    buscarMapa,
    toggleItem,
    alterarQuantidade,
    solicitar,
  } = useSolicitarCorteOperacional();

  const handleSolicitar = async () => {
    const corte = await solicitar();
    if (corte) {
      router.push(`/expedicao/corte-operacional/${corte.id}`);
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
                <Link href="/expedicao/corte-operacional">
                  <ArrowLeft className="size-4" aria-hidden />
                  Voltar
                </Link>
              </Button>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Solicitar corte operacional
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Bipe o mapa-grupo, selecione os materiais e informe as
                quantidades.
              </p>
            </div>
          </header>

          <CorteBipInput
            value={codigoBip}
            onChange={setCodigoBip}
            onBuscar={buscarMapa}
            buscando={buscando}
          />

          {mapa ? (
            <>
              <CorteMapaResumo mapa={mapa} />
              <CorteItensSelecaoTable
                mapa={mapa}
                selecao={selecao}
                onToggle={toggleItem}
                onQuantidadeChange={alterarQuantidade}
              />

              <div className="grid gap-4 rounded-xl border border-outline-variant/50 bg-glass-bg p-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="corte-doca"
                    className="text-xs font-semibold text-foreground"
                  >
                    Doca (opcional)
                  </label>
                  <input
                    id="corte-doca"
                    value={doca}
                    onChange={(event) => setDoca(event.target.value)}
                    placeholder="Ex: Doca 07"
                    className="mt-1 h-9 w-full rounded-md border border-outline-variant/60 bg-surface-low px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="corte-motivo"
                    className="text-xs font-semibold text-foreground"
                  >
                    Motivo (opcional)
                  </label>
                  <input
                    id="corte-motivo"
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    placeholder="Motivo do corte"
                    className="mt-1 h-9 w-full rounded-md border border-outline-variant/60 bg-surface-low px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="corte-observacao"
                    className="text-xs font-semibold text-foreground"
                  >
                    Observação (opcional)
                  </label>
                  <input
                    id="corte-observacao"
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    placeholder="Observações adicionais"
                    className="mt-1 h-9 w-full rounded-md border border-outline-variant/60 bg-surface-low px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSolicitar}
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Enviando…
                    </>
                  ) : (
                    'Solicitar corte'
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </SidebarMain>
  );
}
