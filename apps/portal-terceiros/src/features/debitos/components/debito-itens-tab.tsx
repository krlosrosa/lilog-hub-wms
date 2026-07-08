import {
  DEBITO_ITEM_TIPO_LABELS,
  formatMoeda,
  type ProcessoDebitoItem,
} from '../types/debito.types';

type DebitoItensTabProps = {
  itens: ProcessoDebitoItem[];
};

export function DebitoItensTab({ itens }: DebitoItensTabProps) {
  if (itens.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Nenhum item registrado neste processo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="px-2.5 py-1.5 font-medium">SKU</th>
            <th className="px-2.5 py-1.5 font-medium">Produto</th>
            <th className="px-2.5 py-1.5 font-medium">Tipo</th>
            <th className="px-2.5 py-1.5 font-medium text-right">Qtd</th>
            <th className="px-2.5 py-1.5 font-medium text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => (
            <tr
              key={item.id}
              className={
                index % 2 === 0
                  ? 'border-b border-border/30'
                  : 'border-b border-border/30 bg-muted/15'
              }
            >
              <td className="whitespace-nowrap px-2.5 py-1.5 font-medium">
                {item.sku ?? '—'}
              </td>
              <td className="max-w-[12rem] truncate px-2.5 py-1.5">
                {item.descricaoProduto ?? '—'}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5">
                {DEBITO_ITEM_TIPO_LABELS[item.tipo]}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right tabular-nums">
                {item.qtdAnomalia ?? item.quantidade ?? '—'}
              </td>
              <td className="whitespace-nowrap px-2.5 py-1.5 text-right font-medium tabular-nums">
                {formatMoeda(item.valorDebito)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
