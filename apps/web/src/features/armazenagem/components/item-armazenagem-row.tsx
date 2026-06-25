'use client';

import { MapPin, Package } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';

import { ItemArmazenagemStatusBadge } from './demanda-status-badge';
import type { ItemArmazenagemView } from '../types/armazenagem.api';

type ItemArmazenagemRowProps = {
  item: ItemArmazenagemView;
  onSelecionarEndereco: (item: ItemArmazenagemView) => void;
};

export function ItemArmazenagemRow({
  item,
  onSelecionarEndereco,
}: ItemArmazenagemRowProps) {
  const podeEditar = item.status !== 'armazenado';

  return (
    <article className="rounded-xl border border-outline-variant bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold text-foreground">
                {item.produtoSku ?? item.produtoId.slice(0, 8)}
              </p>
              <ItemArmazenagemStatusBadge status={item.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {item.produtoNome ?? 'Produto sem nome'}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.quantidade} {item.unidadeMedida}
              {item.lote ? ` · Lote ${item.lote}` : ''}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg border border-outline-variant/70 bg-muted/20 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Endereço sugerido
              </p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {item.enderecoSugeridoLabel ?? 'Não definido'}
              </p>
              {item.enderecoConfirmadoLabel && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Confirmado: {item.enderecoConfirmadoLabel}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant={item.enderecoSugeridoId ? 'outline' : 'default'}
            className="self-start"
            disabled={!podeEditar}
            onClick={() => onSelecionarEndereco(item)}
          >
            {item.enderecoSugeridoId ? 'Alterar endereço' : 'Selecionar endereço'}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function EnderecoDisponivelOption({
  endereco,
  selected,
  onSelect,
}: {
  endereco: {
    id: string;
    enderecoMascarado: string;
    tipo: keyof typeof ENDERECO_TIPO_LABELS;
    zona: string;
    ocupacaoPercent: string;
    prioridadePicking: number | null;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-outline-variant bg-card hover:border-primary/30 hover:bg-muted/30',
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 font-mono text-xs font-bold text-secondary">
        {endereco.prioridadePicking ?? '—'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-semibold text-foreground">
          {endereco.enderecoMascarado}
        </p>
        <p className="text-xs text-muted-foreground">
          {ENDERECO_TIPO_LABELS[endereco.tipo]} · Zona {endereco.zona} · Ocupação{' '}
          {endereco.ocupacaoPercent}%
        </p>
      </div>
    </button>
  );
}
