'use client';

import { cn } from '@lilog/ui';
import { Truck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  fieldLabelClassName,
  fieldSelectClassName,
  sectionCardClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import { RegraWmsSectionHeader } from '@/features/regras-wms/components/regra-wms-section-header';
import { listDepositos, mapDepositoToListaItem } from '@/features/depositos/lib/deposito-api';
import type { DepositoListaItem } from '@/features/depositos/types/depositos-gestao.schema';
import {
  TIPO_ACAO_LABELS,
  TIPOS_ACAO_HABILITADOS,
  type TipoAcao,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2Form } from '@/features/regras-wms/types/regra-wms-tree.schema';

const ACAO_ICONS: Record<TipoAcao, LucideIcon> = {
  mover_deposito: Truck,
  quarentena: Truck,
  bloquear_movimentacao: Truck,
  gerar_alerta: Truck,
  acionar_reposicao: Truck,
  etiqueta_especial: Truck,
};

const ACAO_SHORT_LABELS: Record<TipoAcao, string> = {
  mover_deposito: 'Mover',
  quarentena: 'Quarentena',
  bloquear_movimentacao: 'Bloquear',
  gerar_alerta: 'Alerta',
  acionar_reposicao: 'Reposição',
  etiqueta_especial: 'Etiqueta',
};

export function AcaoConfigurator() {
  const { control, register, setValue, watch } = useFormContext<RegraWmsV2Form>();
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;
  const tipoAcao = watch('acao.tipo');
  const depositoId = watch('acao.parametros.depositoId');

  const [depositos, setDepositos] = useState<DepositoListaItem[]>([]);
  const [isLoadingDepositos, setIsLoadingDepositos] = useState(false);

  useEffect(() => {
    if (!unidadeId) {
      setDepositos([]);
      return;
    }

    let cancelled = false;

    async function loadDepositos() {
      setIsLoadingDepositos(true);
      try {
        const response = await listDepositos(unidadeId!);
        if (!cancelled) {
          setDepositos(response.items.map(mapDepositoToListaItem));
        }
      } catch {
        if (!cancelled) {
          setDepositos([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDepositos(false);
        }
      }
    }

    void loadDepositos();

    return () => {
      cancelled = true;
    };
  }, [unidadeId]);

  useEffect(() => {
    if (!depositoId || depositos.length === 0) {
      return;
    }

    const deposito = depositos.find((item) => item.id === depositoId);
    if (deposito) {
      setValue('acao.parametros.depositoCodigo', deposito.codigo, {
        shouldDirty: true,
      });
    }
  }, [depositoId, depositos, setValue]);

  const mostrarDepositoDestino = tipoAcao === 'mover_deposito';

  return (
    <section className={sectionCardClassName}>
      <RegraWmsSectionHeader step={3} icon={Zap} title="Ação" />

      <Controller
        name="acao.tipo"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-1">
            {TIPOS_ACAO_HABILITADOS.map((tipo) => {
              const Icon = ACAO_ICONS[tipo];
              const selected = field.value === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  title={TIPO_ACAO_LABELS[tipo]}
                  onClick={() => field.onChange(tipo)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all',
                    selected
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'border-outline-variant bg-surface-low/40 text-muted-foreground hover:border-primary/30',
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {ACAO_SHORT_LABELS[tipo]}
                </button>
              );
            })}
          </div>
        )}
      />

      {mostrarDepositoDestino && (
        <div className="mt-2">
          <label className={cn(fieldLabelClassName, 'mb-0.5')}>
            Depósito destino
          </label>
          <select
            {...register('acao.parametros.depositoId')}
            className={fieldSelectClassName}
            disabled={!unidadeId || isLoadingDepositos}
          >
            <option value="">
              {isLoadingDepositos ? 'Carregando depósitos...' : 'Selecione...'}
            </option>
            {depositos.map((deposito) => (
              <option key={deposito.id} value={deposito.id}>
                {deposito.codigo} — {deposito.nome}
              </option>
            ))}
          </select>
          {!unidadeId && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Selecione uma unidade no contexto para listar os depósitos.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
