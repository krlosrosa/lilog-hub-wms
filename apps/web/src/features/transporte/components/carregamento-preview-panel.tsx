'use client';

import { cn } from '@lilog/ui';

import {
  colunaClientesAlinhamento,
  colunaEmpresaAlinhamento,
  DEFAULT_OPCOES_TABELAS_CARREGAMENTO,
  labelColunaClientes,
  labelColunaEmpresa,
  type OpcoesTabelasCarregamento,
  type OrdemTabelaClientesItem,
  type OrdemTabelaEmpresaItem,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import type { CarregamentoPayload } from '@/features/transporte/lib/gerar-mapas-api';

type CarregamentoPreviewPanelProps = {
  carregamento: CarregamentoPayload;
  opcoes?: OpcoesTabelasCarregamento;
};

function formatarNumero(value: number, casas = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function valorColunaEmpresa(
  linha: CarregamentoPayload['minutas'][number]['tabelaEmpresa'][number],
  coluna: OrdemTabelaEmpresaItem,
): string {
  switch (coluna) {
    case 'empresa':
      return linha.empresa;
    case 'categoria':
      return linha.categoria;
    case 'quantidade_unidade':
      return formatarNumero(linha.quantidadeUnidade);
    case 'quantidade_caixa':
      return formatarNumero(linha.quantidadeCaixa);
    case 'quantidade_palete':
      return formatarNumero(linha.quantidadePalete);
    case 'peso':
      return formatarNumero(linha.pesoKg, 3);
    default:
      return '—';
  }
}

function valorColunaClientes(
  linha: CarregamentoPayload['minutas'][number]['tabelaClientes'][number],
  coluna: OrdemTabelaClientesItem,
): string {
  switch (coluna) {
    case 'cliente':
      return linha.cliente;
    case 'cidade':
      return linha.cidade;
    case 'peso':
      return formatarNumero(linha.pesoKg, 3);
    case 'volume':
      return formatarNumero(linha.volumeM3, 3);
    case 'quantidade_unidade':
      return formatarNumero(linha.quantidadeUnidade);
    case 'quantidade_caixa':
      return formatarNumero(linha.quantidadeCaixa);
    case 'quantidade_palete':
      return formatarNumero(linha.quantidadePalete);
    default:
      return '—';
  }
}

function TabelaPreview<T extends string, L>({
  titulo,
  colunas,
  linhas,
  labelColuna,
  alinhamentoColuna,
  resolverValor,
}: {
  titulo: string;
  colunas: T[];
  linhas: L[];
  labelColuna: (coluna: T) => string;
  alinhamentoColuna: (coluna: T) => 'left' | 'right';
  resolverValor: (linha: L, coluna: T) => string;
}) {
  if (colunas.length === 0 || linhas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="overflow-x-auto rounded-md border border-outline-variant/60">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-low/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              {colunas.map((coluna) => (
                <th
                  key={coluna}
                  className={cn(
                    'px-2 py-1.5',
                    alinhamentoColuna(coluna) === 'right' && 'text-right',
                  )}
                >
                  {labelColuna(coluna)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, index) => (
              <tr
                key={index}
                className="border-b border-outline-variant/40 last:border-0"
              >
                {colunas.map((coluna) => (
                  <td
                    key={coluna}
                    className={cn(
                      'px-2 py-1.5 text-foreground',
                      alinhamentoColuna(coluna) === 'right' &&
                        'text-right font-mono',
                    )}
                  >
                    {resolverValor(linha, coluna)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CarregamentoPreviewPanel({
  carregamento,
  opcoes = DEFAULT_OPCOES_TABELAS_CARREGAMENTO,
}: CarregamentoPreviewPanelProps) {
  if (carregamento.totalMinutas === 0) {
    return (
      <p className="px-4 py-8 text-center text-xs text-muted-foreground">
        Nenhuma minuta de carregamento gerada.
      </p>
    );
  }

  return (
    <div className="max-h-[480px] space-y-4 overflow-auto p-4">
      {carregamento.minutas.map((minuta) => (
        <div
          key={minuta.transporteId}
          className="space-y-3 rounded-lg border border-outline-variant/60 bg-surface-low/20 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {minuta.cabecalho.transporte}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {minuta.cabecalho.placa ?? 'Sem placa'}
                {minuta.cabecalho.transportadora
                  ? ` · ${minuta.cabecalho.transportadora}`
                  : ''}
              </p>
            </div>
            <div className="text-right text-[10px] text-muted-foreground">
              <p>Peso: {formatarNumero(minuta.totais.pesoKg, 3)} kg</p>
              <p>Volume: {formatarNumero(minuta.totais.volumeM3, 3)} m³</p>
            </div>
          </div>

          {opcoes.exibirTabelaEmpresa ? (
            <TabelaPreview
              titulo="Lista de Carregamento por Empresa"
              colunas={opcoes.ordemTabelaEmpresa}
              linhas={minuta.tabelaEmpresa}
              labelColuna={labelColunaEmpresa}
              alinhamentoColuna={colunaEmpresaAlinhamento}
              resolverValor={valorColunaEmpresa}
            />
          ) : null}

          {opcoes.exibirTabelaClientes ? (
            <TabelaPreview
              titulo="Lista de Clientes"
              colunas={opcoes.ordemTabelaClientes}
              linhas={minuta.tabelaClientes}
              labelColuna={labelColunaClientes}
              alinhamentoColuna={colunaClientesAlinhamento}
              resolverValor={valorColunaClientes}
            />
          ) : null}

          {!opcoes.exibirTabelaEmpresa && !opcoes.exibirTabelaClientes ? (
            <p className="text-center text-[11px] text-muted-foreground">
              Nenhuma tabela selecionada na configuração de impressão.
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
