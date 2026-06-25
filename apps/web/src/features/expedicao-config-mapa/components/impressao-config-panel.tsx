'use client';

import { cn } from '@lilog/ui';
import { Printer } from 'lucide-react';

import {
  CONFERENCE_CLASSIFICATION_LABELS,
  PRINT_TYPE_LABELS,
  type ConferenceClassificationField,
  type PrintConfig,
  type PrintType,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';
import {
  fieldInputClassName,
  sectionLabelClassName,
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';

type ImpressaoConfigPanelProps = {
  config: PrintConfig;
  onTipoImpressaoChange: (tipo: PrintType) => void;
  onConferenciaSegueSeparacaoChange: (value: boolean) => void;
  onCampoClassificacaoChange: (campo: ConferenceClassificationField) => void;
};

const CLASSIFICATION_OPTIONS = Object.entries(
  CONFERENCE_CLASSIFICATION_LABELS,
) as [ConferenceClassificationField, string][];

export function ImpressaoConfigPanel({
  config,
  onTipoImpressaoChange,
  onConferenciaSegueSeparacaoChange,
  onCampoClassificacaoChange,
}: ImpressaoConfigPanelProps) {
  return (
    <div className="space-y-3 border-t border-outline-variant pt-3">
      <div className="flex items-center gap-2">
        <Printer className="size-3.5 text-primary" aria-hidden />
        <h3 className={sectionLabelClassName}>Impressão e Conferência</h3>
      </div>

      <div className="space-y-1.5">
        <span className={sectionLabelClassName}>Tipo de impressão</span>
        <div className={segmentGroupClassName}>
          {(Object.entries(PRINT_TYPE_LABELS) as [PrintType, string][]).map(
            ([tipo, label]) => (
              <button
                key={tipo}
                type="button"
                onClick={() => onTipoImpressaoChange(tipo)}
                className={segmentButtonClassName(config.tipoImpressao === tipo)}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Define se os mapas impressos serão emitidos agrupados por cliente ou
          por transporte.
        </p>
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-md border px-2.5 py-2',
          config.conferenciaSegueSeparacao
            ? 'border-primary/30 bg-primary/5'
            : 'border-outline-variant bg-surface-low/40',
        )}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">
            Conferência segue padrão de separação
          </p>
          <p className="text-[10px] text-muted-foreground">
            Usa o mesmo agrupamento configurado na separação
          </p>
        </div>
        <SwitchToggle
          checked={config.conferenciaSegueSeparacao}
          onChange={() =>
            onConferenciaSegueSeparacaoChange(!config.conferenciaSegueSeparacao)
          }
          label="Conferência segue padrão de separação"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="campo-classificacao-conferencia"
          className={sectionLabelClassName}
        >
          Classificação da conferência
        </label>
        <select
          id="campo-classificacao-conferencia"
          value={config.campoClassificacaoConferencia}
          onChange={(event) =>
            onCampoClassificacaoChange(
              event.target.value as ConferenceClassificationField,
            )
          }
          disabled={config.conferenciaSegueSeparacao}
          className={cn(
            fieldInputClassName,
            config.conferenciaSegueSeparacao &&
              'cursor-not-allowed opacity-50',
          )}
        >
          {CLASSIFICATION_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-muted-foreground">
          {config.conferenciaSegueSeparacao
            ? 'Herdado automaticamente das regras de agrupamento da separação.'
            : 'Campo usado para organizar e validar os itens na conferência.'}
        </p>
      </div>
    </div>
  );
}
