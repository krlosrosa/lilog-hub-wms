'use client';

import { cn } from '@lilog/ui';

import type {
  ItemSelecionadoCorte,
  MapaGrupoCorte,
} from '@/features/corte-operacional/types/corte-operacional.schema';

type CorteItensSelecaoTableProps = {
  mapa: MapaGrupoCorte;
  selecao: ItemSelecionadoCorte[];
  onToggle: (mapaGrupoItemId: string, checked: boolean) => void;
  onQuantidadeChange: (mapaGrupoItemId: string, quantidade: number) => void;
};

export function CorteItensSelecaoTable({
  mapa,
  selecao,
  onToggle,
  onQuantidadeChange,
}: CorteItensSelecaoTableProps) {
  const itensById = new Map(mapa.itens.map((item) => [item.id, item]));

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <div className="border-b border-outline-variant bg-surface-low px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Lista de materiais
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Selecione os itens e informe a quantidade a cortar.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-surface-highest/50">
              <th className="w-10 px-3 py-2" scope="col">
                <span className="sr-only">Selecionar</span>
              </th>
              <th className="px-3 py-2 font-semibold text-muted-foreground">
                SKU
              </th>
              <th className="hidden px-3 py-2 font-semibold text-muted-foreground md:table-cell">
                Produto
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
            {selecao.map((linha) => {
              const item = itensById.get(linha.mapaGrupoItemId);
              if (!item) return null;

              const invalido = linha.quantidadeCorte > linha.quantidadeMapa;

              return (
                <tr
                  key={linha.mapaGrupoItemId}
                  className={cn(
                    'transition-colors hover:bg-surface-highest/40',
                    linha.selecionado && 'bg-primary/5',
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={linha.selecionado}
                      onChange={(event) =>
                        onToggle(linha.mapaGrupoItemId, event.target.checked)
                      }
                      aria-label={`Selecionar ${item.sku}`}
                      className="size-4 rounded border-outline-variant"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">
                    {item.sku}
                  </td>
                  <td className="hidden max-w-[180px] truncate px-3 py-2 text-foreground md:table-cell">
                    {item.descricao ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-foreground">{item.remessa}</td>
                  <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                    {linha.quantidadeMapa} {item.unidadeMedida}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!linha.selecionado}
                      value={linha.quantidadeCorte}
                      onChange={(event) =>
                        onQuantidadeChange(
                          linha.mapaGrupoItemId,
                          Number(event.target.value),
                        )
                      }
                      className={cn(
                        'h-8 w-24 rounded border bg-surface-low px-2 text-center text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-ring',
                        invalido
                          ? 'border-destructive text-destructive'
                          : 'border-outline-variant/60',
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
