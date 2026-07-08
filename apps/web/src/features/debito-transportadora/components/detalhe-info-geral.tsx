import { MapPin } from 'lucide-react';

import { DebitoOperacaoNfBadge } from '@/features/debito-transportadora/components/debito-operacao-nf-badge';
import { DetalheSection } from '@/features/debito-transportadora/components/detalhe-section';
import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';

type DetalheInfoGeralProps = {
  debito: DebitoDetalhe;
  onEditar: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

export function DetalheInfoGeral({ debito, onEditar }: DetalheInfoGeralProps) {
  return (
    <DetalheSection
      id="titulo-info-geral"
      title="Informações Gerais"
      action={
        <button
          type="button"
          className="text-[11px] font-semibold text-primary hover:underline"
          onClick={onEditar}
        >
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 lg:grid-cols-4">
        <InfoField label="Data do Incidente">{debito.dataIncidente}</InfoField>
        <InfoField label="Transportadora">{debito.transportadora}</InfoField>
        <InfoField label="Pedido">
          <span className="font-medium text-primary">{debito.pedido}</span>
        </InfoField>
        <InfoField label="Peso Afetado">
          {debito.pesoAfetadoKg.toLocaleString('pt-BR')} kg
        </InfoField>
        <InfoField label="Valor Reclamado">
          <span className="font-semibold tabular-nums text-tertiary">
            {formatCurrency(debito.valorReclamado)}
          </span>
        </InfoField>
        <InfoField label="Origem">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{debito.origem}</span>
          </span>
        </InfoField>
        <InfoField label="Destino">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{debito.destino}</span>
          </span>
        </InfoField>
      </div>

      {debito.notasFiscais.length > 0 ? (
        <div className="mt-3 border-t border-outline-variant/60 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Notas Fiscais ({debito.notasFiscais.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {debito.notasFiscais.map((nf) => (
              <div
                key={nf.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/60 bg-surface-low px-2 py-1"
              >
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {nf.numero}
                </span>
                <DebitoOperacaoNfBadge operacao={nf.operacao} short />
                {nf.pedido ? (
                  <span className="text-[10px] text-muted-foreground">{nf.pedido}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </DetalheSection>
  );
}
