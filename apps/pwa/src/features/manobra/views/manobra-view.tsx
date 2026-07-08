import { cn } from '@lilog/ui';
import { Truck } from 'lucide-react';
import { useCallback, useState } from 'react';

import { hapticLight } from '@/lib/haptics';

import { ConfirmarEncostoSheet } from '../components/confirmar-encosto-sheet';
import { DemandaSecaoTitulo } from '../components/demanda-secao-titulo';
import { FilaPorDoca } from '../components/fila-por-doca';
import { FiltroTransportadoraChips } from '../components/filtro-transportadora';
import { ProximoVeiculoHero } from '../components/proximo-veiculo-hero';
import { VeiculoNaDocaCard } from '../components/veiculo-na-doca-card';
import { VeiculoRetirarCard } from '../components/veiculo-retirar-card';
import { useManobra, type ManobraAba } from '../hooks/use-manobra';
import type { Veiculo } from '../types/manobra.schema';

const ABAS: { id: ManobraAba; label: string }[] = [
  { id: 'demanda', label: 'Demanda' },
  { id: 'na_doca', label: 'Na doca' },
];

function AbaChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick();
      }}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-label-md font-semibold transition-colors touch-manipulation active:scale-[0.98]',
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
      {count > 0 ? (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
            active ? 'bg-on-secondary/20' : 'bg-on-surface-variant/10',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function ManobraView() {
  const {
    aba,
    proximoEncostar,
    filasPorDoca,
    veiculosEncostar,
    veiculosRetirar,
    veiculosNaDoca,
    veiculoSelecionado,
    filtroTransportadora,
    transportadoras,
    contadores,
    setAba,
    setFiltroTransportadora,
    confirmarEncosto,
    confirmarRetirada,
    selecionarVeiculo,
    limparSelecao,
  } = useManobra();

  const [sheetAberto, setSheetAberto] = useState(false);

  const handleConfirmarClick = useCallback(
    (veiculo: Veiculo) => {
      selecionarVeiculo(veiculo.id);
      setSheetAberto(true);
    },
    [selecionarVeiculo],
  );

  const handleConfirmarEncosto = useCallback(() => {
    if (!veiculoSelecionado) return;
    confirmarEncosto(veiculoSelecionado.id);
    setSheetAberto(false);
  }, [confirmarEncosto, veiculoSelecionado]);

  const handleRetirar = useCallback(
    (veiculo: Veiculo) => {
      confirmarRetirada(veiculo.id);
    },
    [confirmarRetirada],
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetAberto(open);
      if (!open) limparSelecao();
    },
    [limparSelecao],
  );

  const demandaVazia = veiculosEncostar.length === 0 && veiculosRetirar.length === 0;
  const naDocaVazia = veiculosNaDoca.length === 0;

  const subtitulo =
    aba === 'demanda'
      ? [
          veiculosRetirar.length > 0
            ? `${veiculosRetirar.length} para retirar`
            : null,
          veiculosEncostar.length > 0
            ? `${veiculosEncostar.length} para encostar`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Nenhuma demanda no momento'
      : 'Veículos encostados aguardando operação';

  return (
    <div className="page-enter flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface px-margin-mobile pb-4 pt-safe">
        <div className="flex items-center gap-3 pt-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <Truck className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-headline-md font-bold text-on-surface">Manobra</h1>
            <p className="text-body-sm text-on-surface-variant">{subtitulo}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {ABAS.map((item) => (
            <AbaChip
              key={item.id}
              label={item.label}
              count={contadores[item.id]}
              active={aba === item.id}
              onClick={() => setAba(item.id)}
            />
          ))}
        </div>

        <div className="mt-3">
          <FiltroTransportadoraChips
            opcoes={transportadoras}
            selecionada={filtroTransportadora}
            onSelecionar={setFiltroTransportadora}
          />
        </div>
      </header>

      <div className="flex-1 space-y-6 px-margin-mobile py-4">
        {aba === 'demanda' ? (
          demandaVazia ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Truck className="h-12 w-12 text-on-surface-variant/40" aria-hidden />
              <p className="text-body-md font-medium text-on-surface">Nenhuma demanda</p>
              <p className="text-body-sm text-on-surface-variant">
                {filtroTransportadora === 'todas'
                  ? 'Aguarde encostar ou retirar veículos'
                  : `Nenhuma demanda de ${filtroTransportadora}`}
              </p>
            </div>
          ) : (
            <>
              {veiculosRetirar.length > 0 ? (
                <section className="space-y-3">
                  <DemandaSecaoTitulo
                    titulo="Para retirar"
                    count={veiculosRetirar.length}
                    variant="retirar"
                  />
                  <ul className="flex flex-col gap-3">
                    {veiculosRetirar.map((veiculo) => (
                      <li key={veiculo.id}>
                        <VeiculoRetirarCard veiculo={veiculo} onRetirar={handleRetirar} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {veiculosEncostar.length > 0 ? (
                <section className="space-y-3">
                  <DemandaSecaoTitulo
                    titulo="Para encostar"
                    count={veiculosEncostar.length}
                    variant="encostar"
                  />
                  {proximoEncostar ? (
                    <ProximoVeiculoHero
                      veiculo={proximoEncostar}
                      posicaoGlobal={1}
                      totalNaFila={veiculosEncostar.length}
                      onConfirmar={handleConfirmarClick}
                    />
                  ) : null}
                  <FilaPorDoca
                    filas={filasPorDoca}
                    proximoVeiculoId={proximoEncostar?.id ?? null}
                  />
                </section>
              ) : null}
            </>
          )
        ) : naDocaVazia ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Truck className="h-12 w-12 text-on-surface-variant/40" aria-hidden />
            <p className="text-body-md font-medium text-on-surface">Nenhum veículo na doca</p>
            <p className="text-body-sm text-on-surface-variant">
              {filtroTransportadora === 'todas'
                ? 'Veículos encostados aparecerão aqui'
                : `Nenhum veículo de ${filtroTransportadora} na doca`}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {veiculosNaDoca.map((veiculo) => (
              <li key={veiculo.id}>
                <VeiculoNaDocaCard veiculo={veiculo} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmarEncostoSheet
        open={sheetAberto}
        veiculo={veiculoSelecionado}
        onOpenChange={handleSheetOpenChange}
        onConfirmar={handleConfirmarEncosto}
      />
    </div>
  );
}
