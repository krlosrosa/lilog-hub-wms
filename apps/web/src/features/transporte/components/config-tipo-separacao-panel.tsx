'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { Settings2 } from 'lucide-react';

import {
  ROTAS_DISPONIVEIS,
  TIPO_SEPARACAO_LABELS,
  ZONAS_DISPONIVEIS,
  type ConfigEspecificaTipoSeparacao,
  type TipoSeparacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

const fieldInputClassName = cn(
  'rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type ConfigTipoSeparacaoPanelProps = {
  tipoSeparacao: TipoSeparacao;
  config: ConfigEspecificaTipoSeparacao;
  onChange: (config: ConfigEspecificaTipoSeparacao) => void;
  desabilitado?: boolean;
};

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-secondary-container' : 'bg-surface-highest',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-foreground transition-transform',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

function RadioPill<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opcao) => (
        <button
          key={opcao.value}
          type="button"
          onClick={() => onChange(opcao.value)}
          className={cn(
            'rounded-lg border px-4 py-2 text-xs font-semibold transition-colors',
            value === opcao.value
              ? 'border-primary/40 bg-primary/10 text-foreground'
              : 'border-outline-variant bg-surface-low text-muted-foreground',
          )}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium text-muted-foreground"
    >
      {children}
    </label>
  );
}

export function ConfigTipoSeparacaoPanel({
  tipoSeparacao,
  config,
  onChange,
  desabilitado = false,
}: ConfigTipoSeparacaoPanelProps) {
  if (desabilitado) {
    return null;
  }

  const renderConfig = () => {
    switch (tipoSeparacao) {
      case 'discreto':
        if (config.tipo !== 'discreto') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low/40 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Múltiplos volumes geram mapas separados
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Cada volume de um pedido gera um mapa independente
                </p>
              </div>
              <ToggleSwitch
                checked={config.multiploVolumesMapasSeparados}
                onChange={(ativo) =>
                  onChange({
                    ...config,
                    multiploVolumesMapasSeparados: ativo,
                  })
                }
                label="Múltiplos volumes geram mapas separados"
              />
            </div>
            <div>
              <FieldLabel htmlFor="limite-itens-mapa">
                Limite de itens por mapa
              </FieldLabel>
              <input
                id="limite-itens-mapa"
                type="number"
                min={5}
                max={200}
                value={config.limiteItensPorMapa}
                onChange={(event) =>
                  onChange({
                    ...config,
                    limiteItensPorMapa: Math.max(
                      5,
                      Number(event.target.value) || 5,
                    ),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
          </div>
        );

      case 'zona':
        if (config.tipo !== 'zona') return null;
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Zonas ativas para este transporte</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {ZONAS_DISPONIVEIS.map((zona) => {
                  const ativa = config.zonasAtivas.includes(zona);
                  return (
                    <button
                      key={zona}
                      type="button"
                      onClick={() => {
                        const zonasAtivas = ativa
                          ? config.zonasAtivas.filter((z) => z !== zona)
                          : [...config.zonasAtivas, zona];
                        onChange({ ...config, zonasAtivas });
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        ativa
                          ? 'border-tertiary/40 bg-tertiary/10 text-tertiary'
                          : 'border-outline-variant bg-surface-low text-muted-foreground',
                      )}
                    >
                      {zona}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <FieldLabel>Regra de consolidação entre zonas</FieldLabel>
              <div className="mt-2">
                <RadioPill
                  value={config.consolidacaoZona}
                  options={[
                    { value: 'sincronico', label: 'Disparo síncrono' },
                    {
                      value: 'zona_anterior',
                      label: 'Liberar zona apenas após anterior finalizar',
                    },
                  ]}
                  onChange={(consolidacaoZona) =>
                    onChange({ ...config, consolidacaoZona })
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'onda':
        if (config.tipo !== 'onda') return null;
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <FieldLabel htmlFor="hora-corte">Hora de corte</FieldLabel>
              <input
                id="hora-corte"
                type="time"
                value={config.horaCorte}
                onChange={(event) =>
                  onChange({ ...config, horaCorte: event.target.value })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel htmlFor="transportadora-onda">
                Transportadora
              </FieldLabel>
              <input
                id="transportadora-onda"
                type="text"
                value={config.transportadora}
                onChange={(event) =>
                  onChange({ ...config, transportadora: event.target.value })
                }
                placeholder="Ex: Transportadora X"
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel htmlFor="max-peso-onda">
                Máx. peso da onda (kg)
              </FieldLabel>
              <input
                id="max-peso-onda"
                type="number"
                min={50}
                value={config.maxPeso}
                onChange={(event) =>
                  onChange({
                    ...config,
                    maxPeso: Math.max(50, Number(event.target.value) || 50),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel htmlFor="max-pedidos-onda">
                Máx. pedidos na onda
              </FieldLabel>
              <input
                id="max-pedidos-onda"
                type="number"
                min={1}
                value={config.maxPedidos}
                onChange={(event) =>
                  onChange({
                    ...config,
                    maxPedidos: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
          </div>
        );

      case 'cluster':
        if (config.tipo !== 'cluster') return null;
        return (
          <div className="max-w-xs">
            <FieldLabel htmlFor="capacidade-carrinho">
              Capacidade do carrinho (boxes)
            </FieldLabel>
            <input
              id="capacidade-carrinho"
              type="number"
              min={2}
              max={12}
              value={config.capacidadeCarrinho}
              onChange={(event) =>
                onChange({
                  ...config,
                  capacidadeCarrinho: Math.min(
                    12,
                    Math.max(2, Number(event.target.value) || 2),
                  ),
                })
              }
              className={cn(fieldInputClassName, 'mt-2 w-full')}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Define quantas posições físicas (Box 1, Box 2…) o operador
              utilizará no carrinho
            </p>
          </div>
        );

      case 'corredor':
        if (config.tipo !== 'corredor') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Sentido de fluxo no armazém</FieldLabel>
              <div className="mt-2">
                <RadioPill
                  value={config.fluxo}
                  options={[
                    { value: 'ziguezague', label: 'Zigue-zague (S)' },
                    { value: 'ushape', label: 'U-Shape' },
                  ]}
                  onChange={(fluxo) => onChange({ ...config, fluxo })}
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="max-operadores-corredor">
                Máx. operadores por corredor
              </FieldLabel>
              <input
                id="max-operadores-corredor"
                type="number"
                min={1}
                max={3}
                value={config.maxOperadoresPorCorredor}
                onChange={(event) =>
                  onChange({
                    ...config,
                    maxOperadoresPorCorredor: Math.min(
                      3,
                      Math.max(1, Number(event.target.value) || 1),
                    ),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
          </div>
        );

      case 'produto':
        if (config.tipo !== 'produto') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Filtro de curva ABC</FieldLabel>
              <div className="mt-2">
                <RadioPill
                  value={config.curvaABC}
                  options={[
                    { value: 'A', label: 'Curva A' },
                    { value: 'AB', label: 'Curvas A + B' },
                    { value: 'ABC', label: 'Todas (A, B, C)' },
                  ]}
                  onChange={(curvaABC) => onChange({ ...config, curvaABC })}
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="qtd-minima-produto">
                Quantidade mínima para disparo
              </FieldLabel>
              <input
                id="qtd-minima-produto"
                type="number"
                min={1}
                value={config.quantidadeMinima}
                onChange={(event) =>
                  onChange({
                    ...config,
                    quantidadeMinima: Math.max(
                      1,
                      Number(event.target.value) || 1,
                    ),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Separação por SKU só dispara se houver mais unidades que este
                limite
              </p>
            </div>
          </div>
        );

      case 'rota':
        if (config.tipo !== 'rota') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="rota-veiculo">
                Rota / Placa do veículo
              </FieldLabel>
              <select
                id="rota-veiculo"
                value={config.rotaId}
                onChange={(event) =>
                  onChange({ ...config, rotaId: event.target.value })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              >
                {ROTAS_DISPONIVEIS.map((rota) => (
                  <option key={rota.id} value={rota.id}>
                    {rota.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Ordenação da sequência de entrega</FieldLabel>
              <div className="mt-2">
                <RadioPill
                  value={config.ordenacaoEntrega}
                  options={[
                    {
                      value: 'lifo',
                      label: 'LIFO — último a entregar, primeiro a carregar',
                    },
                    {
                      value: 'fifo',
                      label: 'FIFO — janela de recebimento do cliente',
                    },
                  ]}
                  onChange={(ordenacaoEntrega) =>
                    onChange({ ...config, ordenacaoEntrega })
                  }
                />
              </div>
            </div>
          </div>
        );

      case 'endereco':
        if (config.tipo !== 'endereco') return null;
        return (
          <div>
            <FieldLabel>Prioridade de nível no armazém</FieldLabel>
            <div className="mt-2">
              <RadioPill
                value={config.prioridadeNivel}
                options={[
                  {
                    value: 'chao_primeiro',
                    label: 'Nível térreo primeiro (chão / nível 1)',
                  },
                  {
                    value: 'aereo_primeiro',
                    label: 'Níveis aéreos primeiro (empilhadeira)',
                  },
                ]}
                onChange={(prioridadeNivel) =>
                  onChange({ ...config, prioridadeNivel })
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className={cn(panelClassName, 'space-y-4 p-5')}>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings2 className="size-4 text-primary" aria-hidden />
          Configurações de {TIPO_SEPARACAO_LABELS[tipoSeparacao]}
        </h2>
        <span className="text-xs text-muted-foreground">
          Parâmetros específicos do tipo de separação selecionado
        </span>
      </div>
      {renderConfig()}
    </section>
  );
}
