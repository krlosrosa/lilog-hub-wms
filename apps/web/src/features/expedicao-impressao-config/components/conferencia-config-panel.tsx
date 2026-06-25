'use client';

import {
  fieldInputClassName,
  sectionLabelClassName,
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  AGRUPAMENTO_CONFERENCIA_LABELS,
  CLASSIFICAR_POR_CONFERENCIA_LABELS,
  type AgrupamentoConferencia,
  type ClassificarPorConferencia,
  type OpcoesConferencia,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';

type ConferenciaConfigPanelProps = {
  opcoes: OpcoesConferencia;
  onMudarClassificarPor: (valor: ClassificarPorConferencia) => void;
  onMudarAgrupamento: (valor: AgrupamentoConferencia) => void;
};

const CLASSIFICAR_OPCOES = Object.entries(
  CLASSIFICAR_POR_CONFERENCIA_LABELS,
) as [ClassificarPorConferencia, string][];

const AGRUPAMENTO_OPCOES = Object.entries(
  AGRUPAMENTO_CONFERENCIA_LABELS,
) as [AgrupamentoConferencia, string][];

export function ConferenciaConfigPanel({
  opcoes,
  onMudarClassificarPor,
  onMudarAgrupamento,
}: ConferenciaConfigPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <div>
          <p className={sectionLabelClassName}>Classificar por</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Critério de classificação dos itens no mapa de conferência.
          </p>
        </div>

        <div className={segmentGroupClassName}>
          {CLASSIFICAR_OPCOES.map(([valor, label]) => (
            <button
              key={valor}
              type="button"
              onClick={() => onMudarClassificarPor(valor)}
              className={segmentButtonClassName(opcoes.classificarPor === valor)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <FieldLabel htmlFor="agrupamento-conferencia">Agrupamento</FieldLabel>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Define como os blocos do mapa de conferência serão organizados.
          </p>
        </div>

        <select
          id="agrupamento-conferencia"
          value={opcoes.agrupamento}
          onChange={(event) =>
            onMudarAgrupamento(event.target.value as AgrupamentoConferencia)
          }
          className={fieldInputClassName}
        >
          {AGRUPAMENTO_OPCOES.map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>

        <p className="text-[10px] text-muted-foreground">
          {opcoes.agrupamento === 'replicar_separacao'
            ? 'Os mapas de conferência seguirão os mesmos agrupamentos definidos na separação (clientes segregados, grupos personalizados, etc.).'
            : 'Cada mapa de conferência será agrupado somente pelo transporte, ignorando os agrupamentos da separação.'}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={sectionLabelClassName}>
      {children}
    </label>
  );
}
