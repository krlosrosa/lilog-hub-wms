'use client';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';
import {
  formatPlacaDecimal,
  type PlacaTransportadora,
} from '@/features/transporte/types/placa-transportadora.schema';

const filterFieldClass = cn(
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const detailLabelClass =
  'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';
const detailValueClass = 'text-sm font-medium text-foreground';

type PlacaEditSheetProps = {
  placa: PlacaTransportadora | null;
  perfisTarifas: PerfilTarifaItem[];
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvarPerfil: (placaId: string, perfilTarifaId: string | null) => Promise<void>;
};

export function PlacaEditSheet({
  placa,
  perfisTarifas,
  open,
  isSaving,
  onOpenChange,
  onSalvarPerfil,
}: PlacaEditSheetProps) {
  const [perfilSelecionado, setPerfilSelecionado] = useState('');

  useEffect(() => {
    setPerfilSelecionado(placa?.perfilTarifaId ?? '');
  }, [placa]);

  if (!placa) {
    return null;
  }

  const perfilAtual = perfisTarifas.find(
    (perfil) => perfil.id === placa.perfilTarifaId,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant bg-surface-highest/30 px-6 py-5 text-left">
          <SheetTitle className="font-mono text-foreground">{placa.placa}</SheetTitle>
          <SheetDescription>
            Gestão da placa e associação de perfil de tarifa.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={detailLabelClass}>Transportadora</p>
              <p className={detailValueClass}>{placa.transportadoraNome ?? '—'}</p>
            </div>
            <div>
              <p className={detailLabelClass}>Tipo de veículo</p>
              <p className={detailValueClass}>{placa.tipoVeiculoNome ?? '—'}</p>
            </div>
            <div>
              <p className={detailLabelClass}>Peso (kg)</p>
              <p className={cn(detailValueClass, 'font-mono')}>
                {formatPlacaDecimal(placa.peso)}
              </p>
            </div>
            <div>
              <p className={detailLabelClass}>Cubagem</p>
              <p className={cn(detailValueClass, 'font-mono')}>
                {formatPlacaDecimal(placa.cubagem)}
              </p>
            </div>
            <div>
              <p className={detailLabelClass}>Tara</p>
              <p className={cn(detailValueClass, 'font-mono')}>
                {formatPlacaDecimal(placa.tara)}
              </p>
            </div>
            <div>
              <p className={detailLabelClass}>Estrangeiro</p>
              <p className={detailValueClass}>
                {placa.estrangeiro ? 'Sim' : 'Não'}
              </p>
            </div>
            <div>
              <p className={detailLabelClass}>ID Ravex</p>
              <p className={cn(detailValueClass, 'font-mono')}>
                {placa.idRavexVeiculo}
              </p>
            </div>
            <div>
              <p className={detailLabelClass}>Perfil atual</p>
              <p className={detailValueClass}>{perfilAtual?.nome ?? 'Sem perfil'}</p>
            </div>
          </div>

          <div>
            <label htmlFor="placa-perfil-select" className={detailLabelClass}>
              Perfil de tarifa
            </label>
            <select
              id="placa-perfil-select"
              value={perfilSelecionado}
              onChange={(event) => setPerfilSelecionado(event.target.value)}
              disabled={isSaving}
              className={cn(filterFieldClass, 'mt-2')}
            >
              <option value="">Sem perfil</option>
              {perfisTarifas.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </option>
              ))}
            </select>
            <p className="mt-2 text-body-sm text-muted-foreground">
              A associação de perfil é opcional e pode ser alterada a qualquer momento.
            </p>
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-outline-variant px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            disabled={isSaving}
            onClick={() =>
              void onSalvarPerfil(placa.id, perfilSelecionado || null)
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
