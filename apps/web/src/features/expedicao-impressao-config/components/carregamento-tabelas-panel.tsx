'use client';

import { useMemo, useState } from 'react';

import { cn } from '@lilog/ui';

import { OrdemColunasList } from '@/features/expedicao-impressao-config/components/ordem-colunas-list';
import {
  segmentButtonClassName,
  segmentGroupClassName,
  sectionLabelClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  ALL_ORDEM_TABELA_CLIENTES_ITEMS,
  ALL_ORDEM_TABELA_EMPRESA_ITEMS,
  ORDEM_TABELA_CLIENTES_LABELS,
  ORDEM_TABELA_EMPRESA_LABELS,
  TABELA_CARREGAMENTO_TIPO_LABELS,
  type OpcoesTabelasCarregamento,
  type OrdemTabelaClientesItem,
  type OrdemTabelaEmpresaItem,
  type TabelaCarregamentoTipo,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';

type CarregamentoTabelasPanelProps = {
  opcoes: OpcoesTabelasCarregamento;
  onMudarExibirTabela: (tipo: TabelaCarregamentoTipo, exibir: boolean) => void;
  onMoveColunaUp: (tipo: TabelaCarregamentoTipo, index: number) => void;
  onMoveColunaDown: (tipo: TabelaCarregamentoTipo, index: number) => void;
  onToggleColuna: (
    tipo: TabelaCarregamentoTipo,
    coluna: OrdemTabelaEmpresaItem | OrdemTabelaClientesItem,
  ) => void;
};

const TABS: { id: TabelaCarregamentoTipo; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'clientes', label: 'Clientes' },
];

function CompactToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <SwitchToggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function CarregamentoTabelasPanel({
  opcoes,
  onMudarExibirTabela,
  onMoveColunaUp,
  onMoveColunaDown,
  onToggleColuna,
}: CarregamentoTabelasPanelProps) {
  const [abaAtiva, setAbaAtiva] = useState<TabelaCarregamentoTipo>('empresa');

  const abasDisponiveis = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.id === 'empresa') return opcoes.exibirTabelaEmpresa;
      return opcoes.exibirTabelaClientes;
    });
  }, [opcoes.exibirTabelaEmpresa, opcoes.exibirTabelaClientes]);

  const abaEfetiva =
    abasDisponiveis.find((tab) => tab.id === abaAtiva)?.id ??
    abasDisponiveis[0]?.id ??
    'empresa';

  const tabelaAtivaDesligada =
    abaEfetiva === 'empresa'
      ? !opcoes.exibirTabelaEmpresa
      : !opcoes.exibirTabelaClientes;

  const nenhumaTabelaAtiva =
    !opcoes.exibirTabelaEmpresa && !opcoes.exibirTabelaClientes;

  return (
    <div className="space-y-3">
      <div>
        <p className={sectionLabelClassName}>Tabelas exibidas no mapa</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Escolha quais tabelas aparecem abaixo do cabeçalho de carregamento.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <CompactToggle
          label={TABELA_CARREGAMENTO_TIPO_LABELS.empresa}
          checked={opcoes.exibirTabelaEmpresa}
          onChange={() =>
            onMudarExibirTabela('empresa', !opcoes.exibirTabelaEmpresa)
          }
        />
        <CompactToggle
          label={TABELA_CARREGAMENTO_TIPO_LABELS.clientes}
          checked={opcoes.exibirTabelaClientes}
          onChange={() =>
            onMudarExibirTabela('clientes', !opcoes.exibirTabelaClientes)
          }
        />
      </div>

      {nenhumaTabelaAtiva ? (
        <p className="rounded-md border border-dashed border-outline-variant/60 px-3 py-4 text-center text-[11px] text-muted-foreground">
          Nenhuma tabela selecionada. Ative ao menos uma tabela acima para
          configurar colunas.
        </p>
      ) : (
        <>
          {abasDisponiveis.length > 1 ? (
            <div className={segmentGroupClassName}>
              {abasDisponiveis.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAbaAtiva(tab.id)}
                  className={segmentButtonClassName(abaEfetiva === tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          {abaEfetiva === 'empresa' ? (
            <OrdemColunasList<OrdemTabelaEmpresaItem>
              ordem={opcoes.ordemTabelaEmpresa}
              allItems={ALL_ORDEM_TABELA_EMPRESA_ITEMS}
              labels={ORDEM_TABELA_EMPRESA_LABELS}
              disabled={tabelaAtivaDesligada}
              onMoveUp={(index) => onMoveColunaUp('empresa', index)}
              onMoveDown={(index) => onMoveColunaDown('empresa', index)}
              onToggle={(coluna) => onToggleColuna('empresa', coluna)}
            />
          ) : (
            <OrdemColunasList<OrdemTabelaClientesItem>
              ordem={opcoes.ordemTabelaClientes}
              allItems={ALL_ORDEM_TABELA_CLIENTES_ITEMS}
              labels={ORDEM_TABELA_CLIENTES_LABELS}
              disabled={tabelaAtivaDesligada}
              onMoveUp={(index) => onMoveColunaUp('clientes', index)}
              onMoveDown={(index) => onMoveColunaDown('clientes', index)}
              onToggle={(coluna) => onToggleColuna('clientes', coluna)}
            />
          )}

          {abaEfetiva === 'empresa' && opcoes.ordemTabelaEmpresa.length > 0 ? (
            <p className="truncate text-[10px] text-muted-foreground">
              Ordem:{' '}
              {opcoes.ordemTabelaEmpresa
                .map(
                  (item, index) =>
                    `${index + 1}º ${ORDEM_TABELA_EMPRESA_LABELS[item]}`,
                )
                .join(' → ')}
            </p>
          ) : null}

          {abaEfetiva === 'clientes' && opcoes.ordemTabelaClientes.length > 0 ? (
            <p className={cn('truncate text-[10px] text-muted-foreground')}>
              Ordem:{' '}
              {opcoes.ordemTabelaClientes
                .map(
                  (item, index) =>
                    `${index + 1}º ${ORDEM_TABELA_CLIENTES_LABELS[item]}`,
                )
                .join(' → ')}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
