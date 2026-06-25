'use client';

import { Button, cn } from '@lilog/ui';
import { Trash2 } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldSelectClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import {
  CAMPO_CONDICAO_GRUPOS,
  CAMPO_CONDICAO_LABELS,
  CAMPOS_SELECT,
  OPERADOR_CONDICAO_LABELS,
  getCampoInputType,
  getOperadoresForCampo,
  type CampoCondicao,
  type OperadorCondicao,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { CondicaoFolha } from '@/features/regras-wms/types/regra-wms-tree.schema';

type ConditionRowProps = {
  folha: CondicaoFolha;
  onChange: (folha: CondicaoFolha) => void;
  onRemove: () => void;
  error?: string;
};

export function ConditionRow({
  folha,
  onChange,
  onRemove,
  error,
}: ConditionRowProps) {
  const campo = folha.campo;
  const operador = folha.operador;
  const inputType = getCampoInputType(campo);
  const operadores = getOperadoresForCampo(campo);
  const selectOptions = CAMPOS_SELECT[campo];
  const isEntre = operador === 'entre';

  const handleCampoChange = (novoCampo: CampoCondicao) => {
    const novosOperadores = getOperadoresForCampo(novoCampo);
    const novoOperador = novosOperadores.includes(operador)
      ? operador
      : (novosOperadores[0] ?? 'igual');
    onChange({
      ...folha,
      campo: novoCampo,
      operador: novoOperador,
      valor: '',
      valorFim: undefined,
    });
  };

  return (
    <div>
      <div className="group flex items-center gap-1.5 rounded-md border border-outline-variant/60 bg-surface-low/30 px-2 py-1.5 transition-colors hover:border-primary/25 hover:bg-surface-low/50">
        <select
          aria-label="Campo"
          value={folha.campo}
          className={cn(fieldSelectClassName, 'min-w-0 flex-[2]')}
          onChange={(e) => handleCampoChange(e.target.value as CampoCondicao)}
        >
          {Object.entries(CAMPO_CONDICAO_GRUPOS).map(([grupo, campos]) => (
            <optgroup key={grupo} label={grupo}>
              {campos.map((c) => (
                <option key={c} value={c}>
                  {CAMPO_CONDICAO_LABELS[c]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          aria-label="Operador"
          value={folha.operador}
          className={cn(fieldSelectClassName, 'min-w-0 flex-[1.2]')}
          onChange={(e) =>
            onChange({
              ...folha,
              operador: e.target.value as OperadorCondicao,
            })
          }
        >
          {operadores.map((op) => (
            <option key={op} value={op}>
              {OPERADOR_CONDICAO_LABELS[op]}
            </option>
          ))}
        </select>

        {inputType === 'select' && selectOptions ? (
          <select
            aria-label="Valor"
            value={folha.valor}
            className={cn(fieldSelectClassName, 'min-w-0 flex-[1.2]')}
            onChange={(e) => onChange({ ...folha, valor: e.target.value })}
          >
            <option value="">Valor...</option>
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            aria-label="Valor"
            type={inputType}
            value={folha.valor}
            placeholder="Valor"
            className={cn(fieldInputClassName, 'min-w-0 flex-[1.2]')}
            onChange={(e) => onChange({ ...folha, valor: e.target.value })}
          />
        )}

        {isEntre && (
          <input
            aria-label="Até"
            type={inputType === 'date' ? 'date' : 'number'}
            value={folha.valorFim ?? ''}
            placeholder="Até"
            className={cn(fieldInputClassName, 'min-w-0 flex-1')}
            onChange={(e) =>
              onChange({ ...folha, valorFim: e.target.value })
            }
          />
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="size-6 shrink-0 text-muted-foreground opacity-50 hover:text-destructive group-hover:opacity-100"
          aria-label="Remover condição"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
      {error && (
        <p role="alert" className={cn(fieldErrorClassName, 'mt-0.5 pl-1')}>
          {error}
        </p>
      )}
    </div>
  );
}
