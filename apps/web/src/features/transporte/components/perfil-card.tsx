'use client';

import { Button, cn } from '@lilog/ui';
import {
  Box,
  Hash,
  Pencil,
  Scale,
  Truck,
} from 'lucide-react';

import { TarifaFaixasPanel } from '@/features/transporte/components/tarifa-faixas-panel';
import { TipoCargaBadge } from '@/features/transporte/components/tipo-carga-badge';
import type { FaixaKmItem } from '@/features/transporte/types/perfil-tarifa.schema';
import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';

const nf = new Intl.NumberFormat('pt-BR');

type PerfilCardProps = {
  perfil: PerfilTarifaItem;
  onEditar: () => void;
  editandoTarifa: boolean;
  salvaTarifaComSucesso: boolean;
  faixasEditando: FaixaKmItem[];
  proporcaoMax: number;
  onIniciarEdicaoTarifa: () => void;
  onSalvarTarifa: () => void;
  onCancelarEdicaoTarifa: () => void;
  onAdicionarFaixa: () => void;
  onRemoverFaixa: (index: number) => void;
  onAtualizarFaixa: (
    index: number,
    campo: keyof FaixaKmItem,
    valor: number | string | null,
  ) => void;
  isSubmitting: boolean;
};

function CapacidadeBarra({
  valor,
  maximo,
}: {
  valor: number;
  maximo: number;
}) {
  const pct = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;

  return (
    <div className="h-1 overflow-hidden rounded-full bg-surface-highest">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PerfilCard({
  perfil,
  onEditar,
  editandoTarifa,
  salvaTarifaComSucesso,
  faixasEditando,
  proporcaoMax,
  onIniciarEdicaoTarifa,
  onSalvarTarifa,
  onCancelarEdicaoTarifa,
  onAdicionarFaixa,
  onRemoverFaixa,
  onAtualizarFaixa,
  isSubmitting,
}: PerfilCardProps) {
  const pesoMaxRef = Math.max(perfil.peso, 1);
  const volumeMaxRef = Math.max(perfil.cubagem ?? 1, 1);
  const faixas = editandoTarifa ? faixasEditando : perfil.faixasKm;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/60',
        'bg-gradient-to-br from-primary/8 via-surface-low to-surface-low',
        'shadow-inner-glow backdrop-blur-glass',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Truck className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
              {perfil.nome}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <TipoCargaBadge tipoCarga={perfil.tipoCarga} />
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-highest px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                <Hash className="size-2.5" aria-hidden />
                Ravex {perfil.idRavex}
              </span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100"
          onClick={onEditar}
          aria-label={`Editar perfil ${perfil.nome}`}
        >
          <Pencil className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="rounded-xl bg-surface-low/70 px-3 py-2.5 ring-1 ring-inset ring-outline-variant/35">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Scale className="size-3" aria-hidden />
              Peso
            </div>
            <span className="font-mono text-sm font-bold text-foreground">
              {nf.format(perfil.peso)}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                kg
              </span>
            </span>
          </div>
          <div className="mt-1.5">
            <CapacidadeBarra valor={perfil.peso} maximo={pesoMaxRef} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-low/70 px-3 py-2.5 ring-1 ring-inset ring-outline-variant/35">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Box className="size-3" aria-hidden />
              Cubagem
            </div>
            <span className="font-mono text-sm font-bold text-foreground">
              {perfil.cubagem !== null ? nf.format(perfil.cubagem) : '—'}
              {perfil.cubagem !== null ? (
                <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                  m³
                </span>
              ) : null}
            </span>
          </div>
          {perfil.cubagem !== null ? (
            <div className="mt-1.5">
              <CapacidadeBarra valor={perfil.cubagem} maximo={volumeMaxRef} />
            </div>
          ) : null}
        </div>
      </div>

      {perfil.descricao ? (
        <p className="line-clamp-2 px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
          {perfil.descricao}
        </p>
      ) : null}

      <div className="mt-auto space-y-3 border-t border-outline-variant/35 px-4 py-3">
        <TarifaFaixasPanel
          faixas={faixas}
          editando={editandoTarifa}
          proporcaoMax={proporcaoMax}
          salvaComSucesso={salvaTarifaComSucesso}
          onIniciarEdicao={onIniciarEdicaoTarifa}
          onSalvar={onSalvarTarifa}
          onCancelar={onCancelarEdicaoTarifa}
          onAdicionarFaixa={onAdicionarFaixa}
          onRemoverFaixa={onRemoverFaixa}
          onAtualizarFaixa={onAtualizarFaixa}
          isSubmitting={isSubmitting}
          variant="embedded"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-2 text-xs transition-colors hover:bg-primary/5"
          onClick={onEditar}
        >
          <Pencil className="size-3.5" aria-hidden />
          Editar perfil
        </Button>
      </div>
    </article>
  );
}
