import { cn } from '@lilog/ui';

import { hapticLight } from '@/lib/haptics';

import type { FiltroTransportadora, TransportadoraOpcao } from '../hooks/use-manobra';

interface FiltroTransportadoraProps {
  opcoes: TransportadoraOpcao[];
  selecionada: FiltroTransportadora;
  onSelecionar: (transportadora: FiltroTransportadora) => void;
}

export function FiltroTransportadoraChips({
  opcoes,
  selecionada,
  onSelecionar,
}: FiltroTransportadoraProps) {
  if (opcoes.length === 0) return null;

  const total = opcoes.reduce((acc, opcao) => acc + opcao.count, 0);

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        Transportadora
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onSelecionar('todas');
          }}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-label-sm font-semibold touch-manipulation active:scale-95',
            selecionada === 'todas'
              ? 'bg-secondary text-on-secondary'
              : 'bg-surface-container text-on-surface-variant',
          )}
        >
          Todas
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              selecionada === 'todas' ? 'bg-on-secondary/20' : 'bg-on-surface-variant/10',
            )}
          >
            {total}
          </span>
        </button>

        {opcoes.map((opcao) => (
          <button
            key={opcao.nome}
            type="button"
            onClick={() => {
              hapticLight();
              onSelecionar(opcao.nome);
            }}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-label-sm font-semibold touch-manipulation active:scale-95',
              selecionada === opcao.nome
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface-variant',
            )}
          >
            {opcao.nome}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                selecionada === opcao.nome ? 'bg-on-secondary/20' : 'bg-on-surface-variant/10',
              )}
            >
              {opcao.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
