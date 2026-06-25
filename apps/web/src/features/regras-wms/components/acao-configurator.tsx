'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  Ban,
  PackagePlus,
  ShieldAlert,
  Tag,
  Truck,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  fieldInputClassName,
  fieldLabelClassName,
  fieldSelectClassName,
  sectionCardClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import { RegraWmsSectionHeader } from '@/features/regras-wms/components/regra-wms-section-header';
import {
  PRIORIDADE_ALERTA_LABELS,
  TIPO_ACAO_LABELS,
  ZONAS_DESTINO,
  type TipoAcao,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2Form } from '@/features/regras-wms/types/regra-wms-tree.schema';

const ACOES_COM_ZONA: TipoAcao[] = ['mover_deposito', 'quarentena'];
const ACOES_COM_MENSAGEM: TipoAcao[] = [
  'gerar_alerta',
  'acionar_reposicao',
  'etiqueta_especial',
];
const ACOES_COM_MOTIVO: TipoAcao[] = [
  'bloquear_movimentacao',
  'mover_deposito',
  'quarentena',
];

const ACAO_ICONS: Record<TipoAcao, LucideIcon> = {
  mover_deposito: Truck,
  quarentena: ShieldAlert,
  bloquear_movimentacao: Ban,
  gerar_alerta: AlertTriangle,
  acionar_reposicao: PackagePlus,
  etiqueta_especial: Tag,
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
  const { control, register, watch } = useFormContext<RegraWmsV2Form>();
  const tipoAcao = watch('acao.tipo');

  const hasParams =
    ACOES_COM_ZONA.includes(tipoAcao) ||
    tipoAcao === 'gerar_alerta' ||
    ACOES_COM_MENSAGEM.includes(tipoAcao) ||
    ACOES_COM_MOTIVO.includes(tipoAcao);

  return (
    <section className={sectionCardClassName}>
      <RegraWmsSectionHeader step={3} icon={Zap} title="Ação" />

      <Controller
        name="acao.tipo"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-1">
            {(Object.keys(TIPO_ACAO_LABELS) as TipoAcao[]).map((tipo) => {
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

      {hasParams && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACOES_COM_ZONA.includes(tipoAcao) && (
            <div>
              <label className={cn(fieldLabelClassName, 'mb-0.5')}>
                Zona destino
              </label>
              <select
                {...register('acao.parametros.zonaDestino')}
                className={fieldSelectClassName}
              >
                <option value="">Selecione...</option>
                {ZONAS_DESTINO.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoAcao === 'gerar_alerta' && (
            <div>
              <label className={cn(fieldLabelClassName, 'mb-0.5')}>
                Prioridade
              </label>
              <select
                {...register('acao.parametros.prioridade')}
                className={fieldSelectClassName}
              >
                {Object.entries(PRIORIDADE_ALERTA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {ACOES_COM_MENSAGEM.includes(tipoAcao) && (
            <div className="sm:col-span-2">
              <label className={cn(fieldLabelClassName, 'mb-0.5')}>
                Mensagem
              </label>
              <input
                {...register('acao.parametros.mensagem')}
                placeholder="Mensagem para o operador..."
                className={fieldInputClassName}
              />
            </div>
          )}

          {ACOES_COM_MOTIVO.includes(tipoAcao) && (
            <div className="sm:col-span-2">
              <label className={cn(fieldLabelClassName, 'mb-0.5')}>Motivo</label>
              <input
                {...register('acao.parametros.motivo')}
                placeholder="Motivo no histórico..."
                className={fieldInputClassName}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
