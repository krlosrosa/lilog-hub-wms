'use client';

import { cn } from '@lilog/ui';

import {
  sectionLabelClassName,
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  TIPO_DADOS_BASICOS_LABELS,
  type TipoDadosBasicos,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';

const TIPO_OPCOES = Object.entries(TIPO_DADOS_BASICOS_LABELS) as [
  TipoDadosBasicos,
  string,
][];

type DadosBasicosPanelProps = {
  tipo: TipoDadosBasicos;
  centroId: string;
  usuarioId: string;
  onMudarTipo: (tipo: TipoDadosBasicos) => void;
};

export function DadosBasicosPanel({
  tipo,
  centroId,
  usuarioId,
  onMudarTipo,
}: DadosBasicosPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className={sectionLabelClassName}>Tipo</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Define se a configuração de impressão será aplicada por cliente ou
          por transporte.
        </p>
        <div className={cn(segmentGroupClassName, 'mt-2')}>
          {TIPO_OPCOES.map(([valor, label]) => (
            <button
              key={valor}
              type="button"
              onClick={() => onMudarTipo(valor)}
              className={segmentButtonClassName(tipo === valor)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="truncate rounded-md border border-outline-variant/50 bg-surface-lowest px-2 py-1.5"
          title={centroId}
        >
          <p className={sectionLabelClassName}>Centro</p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            {centroId.slice(0, 8)}…
          </p>
        </div>
        <div className="rounded-md border border-outline-variant/50 bg-surface-lowest px-2 py-1.5">
          <p className={sectionLabelClassName}>Usuário</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {usuarioId}
          </p>
        </div>
      </div>
    </div>
  );
}
