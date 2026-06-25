import { cn } from '@lilog/ui';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { useContagemAvariasEndereco } from '../hooks/use-contagem-avarias-endereco';
import { normalizeContagemEndereco } from '../lib/contagem-avarias-store';

interface ContagemAvariaEnderecoCardProps {
  demandaId: string;
  endereco: string;
  className?: string;
}

export function ContagemAvariaEnderecoCard({
  demandaId,
  endereco,
  className,
}: ContagemAvariaEnderecoCardProps) {
  const { avarias, hasAvaria, removeAvaria, getMotivoLabel } = useContagemAvariasEndereco(
    demandaId,
    endereco
  );

  if (!hasAvaria || !endereco.trim() || normalizeContagemEndereco(endereco) === '—') {
    return null;
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-warning/35 bg-warning-container/15 shadow-sm',
        className
      )}
      aria-label="Avarias registradas neste endereço"
    >
      <div className="flex items-center gap-2 border-b border-warning/20 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        <h3 className="min-w-0 flex-1 text-label-md font-semibold text-on-warning-container">
          Avaria neste endereço
        </h3>
        <span className="shrink-0 rounded-full bg-warning-container px-2 py-0.5 font-mono text-label-sm font-semibold text-on-warning-container">
          {avarias.length}
        </span>
      </div>
      <ul className="divide-y divide-warning/15">
        {avarias.map((avaria) => (
          <li key={avaria.id} className="flex items-start gap-2 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-label-md font-semibold text-on-surface">
                {getMotivoLabel(avaria.motivo)}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {avaria.quantidadeCaixas} cx · {avaria.quantidadeUnidades} un
                {avaria.photoCount > 0
                  ? ` · ${avaria.photoCount} ${avaria.photoCount === 1 ? 'foto' : 'fotos'}`
                  : ''}
              </p>
              {avaria.sku && avaria.sku !== '—' && (
                <p className="truncate font-mono text-label-sm text-on-surface-variant">
                  SKU {avaria.sku}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Excluir registro de avaria"
              onClick={() => {
                hapticLight();
                removeAvaria(avaria.id);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-destructive transition-colors active:bg-destructive/10 touch-manipulation"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ContagemAvariaEnderecoBadge({ demandaId, endereco }: ContagemAvariaEnderecoCardProps) {
  const { hasAvaria } = useContagemAvariasEndereco(demandaId, endereco);

  if (!hasAvaria) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-container px-2 py-0.5 text-label-sm font-medium text-on-warning-container">
      <AlertTriangle className="h-3 w-3 text-warning" aria-hidden />
      Avaria
    </span>
  );
}
