'use client';

import { useState } from 'react';

import { Button, cn } from '@lilog/ui';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';

import {
  AGRUPAMENTO_MAPA_LABELS,
  TIPO_ITEM_GRUPO_LABELS,
  type AgrupamentoMapa,
  type ConfigAgrupamentoMapa,
  type GrupoMapaCustomizado,
  type TipoItemGrupoMapa,
} from '@/features/transporte/types/transporte.schema';

const AGRUPAMENTO_OPCOES = Object.entries(AGRUPAMENTO_MAPA_LABELS) as [
  AgrupamentoMapa,
  string,
][];

const PLACEHOLDER_ITEM_GRUPO: Record<TipoItemGrupoMapa, string> = {
  transporte: 'Informe a rota do transporte',
  cliente: 'Informe o código do cliente',
  remessa: 'Informe o número da remessa / NF',
};

const fieldInputClassName = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type AgrupamentoMapaPanelProps = {
  agrupamento: ConfigAgrupamentoMapa;
  onToggleTipo: (tipo: AgrupamentoMapa) => void;
  onAdicionarClienteSegregado: (codCliente: string) => void;
  onRemoverClienteSegregado: (codCliente: string) => void;
  onAdicionarGrupo: () => void;
  onRemoverGrupo: (grupoId: string) => void;
  onAtualizarGrupo: (
    grupoId: string,
    dados: Partial<Pick<GrupoMapaCustomizado, 'nome' | 'tipoItem'>>,
  ) => void;
  onAdicionarItemGrupo: (grupoId: string, itemId: string) => void;
  onRemoverItemGrupo: (grupoId: string, itemId: string) => void;
};

function AdicionarItensPorTexto({
  label,
  placeholder,
  itens,
  emptyMessage,
  onAdicionar,
  onRemover,
  mono = false,
}: {
  label: string;
  placeholder: string;
  itens: string[];
  emptyMessage: string;
  onAdicionar: (valor: string) => void;
  onRemover: (valor: string) => void;
  mono?: boolean;
}) {
  const [valor, setValor] = useState('');

  const handleAdicionar = () => {
    const item = valor.trim();
    if (!item) {
      return;
    }

    onAdicionar(item);
    setValor('');
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdicionar();
            }
          }}
          placeholder={placeholder}
          className={cn(fieldInputClassName, 'flex-1', mono && 'font-mono')}
          aria-label={label}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-[11px]"
          onClick={handleAdicionar}
          disabled={!valor.trim()}
        >
          <Plus className="size-3.5" aria-hidden />
          Adicionar
        </Button>
      </div>
      {itens.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {itens.map((item) => (
            <span
              key={item}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-primary/30',
                'bg-primary/5 px-2 py-0.5 text-[11px] text-foreground',
                mono && 'font-mono',
              )}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemover(item)}
                className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${item}`}
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type GrupoPersonalizadoCardProps = {
  grupo: GrupoMapaCustomizado;
  index: number;
  onRemover: () => void;
  onAtualizar: (
    dados: Partial<Pick<GrupoMapaCustomizado, 'nome' | 'tipoItem'>>,
  ) => void;
  onAdicionarItem: (itemId: string) => void;
  onRemoverItem: (itemId: string) => void;
};

function GrupoPersonalizadoCard({
  grupo,
  index,
  onRemover,
  onAtualizar,
  onAdicionarItem,
  onRemoverItem,
}: GrupoPersonalizadoCardProps) {
  const [expandido, setExpandido] = useState(true);

  const titulo = grupo.nome.trim() || `Grupo ${index + 1}`;

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-low/50">
      <div className="flex items-center gap-1 border-b border-outline-variant/60 bg-surface-low/80 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-surface-low"
          aria-expanded={expandido}
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              expandido && 'rotate-90',
            )}
            aria-hidden
          />
          <span className="truncate text-xs font-semibold text-foreground">
            {titulo}
          </span>
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-semibold text-primary">
            {grupo.itens.length} item{grupo.itens.length !== 1 ? 's' : ''}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            · {TIPO_ITEM_GRUPO_LABELS[grupo.tipoItem]}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemover}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remover ${titulo}`}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>

      {expandido && (
        <div className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`grupo-nome-${grupo.id}`}
                className="mb-1 block text-[10px] font-medium text-muted-foreground"
              >
                Nome do grupo
              </label>
              <input
                id={`grupo-nome-${grupo.id}`}
                type="text"
                value={grupo.nome}
                onChange={(event) =>
                  onAtualizar({ nome: event.target.value })
                }
                placeholder="Ex.: Rota sul, VIP..."
                className={fieldInputClassName}
              />
            </div>
            <div>
              <label
                htmlFor={`grupo-tipo-${grupo.id}`}
                className="mb-1 block text-[10px] font-medium text-muted-foreground"
              >
                Tipo de item
              </label>
              <select
                id={`grupo-tipo-${grupo.id}`}
                value={grupo.tipoItem}
                onChange={(event) =>
                  onAtualizar({
                    tipoItem: event.target.value as TipoItemGrupoMapa,
                  })
                }
                className={fieldInputClassName}
              >
                {(
                  Object.entries(TIPO_ITEM_GRUPO_LABELS) as [
                    TipoItemGrupoMapa,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AdicionarItensPorTexto
            label={`Itens do grupo (${TIPO_ITEM_GRUPO_LABELS[grupo.tipoItem]})`}
            placeholder={PLACEHOLDER_ITEM_GRUPO[grupo.tipoItem]}
            itens={grupo.itens}
            emptyMessage="Informe os valores que compõem este grupo."
            onAdicionar={onAdicionarItem}
            onRemover={onRemoverItem}
            mono={grupo.tipoItem === 'cliente'}
          />
        </div>
      )}
    </div>
  );
}

export function AgrupamentoMapaPanel({
  agrupamento,
  onToggleTipo,
  onAdicionarClienteSegregado,
  onRemoverClienteSegregado,
  onAdicionarGrupo,
  onRemoverGrupo,
  onAtualizarGrupo,
  onAdicionarItemGrupo,
  onRemoverItemGrupo,
}: AgrupamentoMapaPanelProps) {
  const segregarClientesAtivo = agrupamento.tiposAtivos.includes('segregar_clientes');
  const gruposAtivo = agrupamento.tiposAtivos.includes('grupos_customizados');

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {AGRUPAMENTO_OPCOES.map(([valor, label]) => {
          const ativo = agrupamento.tiposAtivos.includes(valor);

          return (
            <label
              key={valor}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors',
                ativo
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-outline-variant bg-surface-low/40 text-muted-foreground',
              )}
            >
              <input
                type="checkbox"
                checked={ativo}
                onChange={() => onToggleTipo(valor)}
                className="size-3.5 rounded border-input accent-primary"
              />
              {label}
            </label>
          );
        })}
      </div>

      {segregarClientesAtivo && (
        <div className="rounded-lg border border-outline-variant bg-surface-low/30 p-3">
          <AdicionarItensPorTexto
            label="Códigos de cliente a segregar"
            placeholder="Informe o código do cliente"
            itens={agrupamento.clientesSegregados}
            emptyMessage="Informe os códigos dos clientes que devem sair em mapas separados."
            onAdicionar={onAdicionarClienteSegregado}
            onRemover={onRemoverClienteSegregado}
            mono
          />
        </div>
      )}

      {gruposAtivo && (
        <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-low/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Grupos personalizados
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={onAdicionarGrupo}
            >
              <Plus className="size-3" aria-hidden />
              Novo grupo
            </Button>
          </div>

          {agrupamento.grupos.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">
              Crie um grupo, defina o nome, o tipo e informe os valores
              manualmente.
            </p>
          ) : (
            <div className="space-y-2">
              {agrupamento.grupos.map((grupo, index) => (
                <GrupoPersonalizadoCard
                  key={grupo.id}
                  grupo={grupo}
                  index={index}
                  onRemover={() => onRemoverGrupo(grupo.id)}
                  onAtualizar={(dados) => onAtualizarGrupo(grupo.id, dados)}
                  onAdicionarItem={(itemId) =>
                    onAdicionarItemGrupo(grupo.id, itemId)
                  }
                  onRemoverItem={(itemId) =>
                    onRemoverItemGrupo(grupo.id, itemId)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
