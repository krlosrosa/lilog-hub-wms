'use client';

import { cn } from '@lilog/ui';

import type {
  BlocoMapaImpressao,
  ConfigMapaImpressao,
} from '@/features/transporte/types/transporte.schema';

function formatarObservacaoLinha(
  linha: BlocoMapaImpressao['linhas'][number],
): string {
  if (linha.quebraPalete) {
    return 'Quebra';
  }

  return '';
}

function CabecalhoBloco({
  bloco,
  config,
}: {
  bloco: BlocoMapaImpressao;
  config: ConfigMapaImpressao;
}) {
  const transporte = bloco.transporte;

  return (
    <header className="mb-3 border-b border-zinc-300 pb-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-900">{bloco.titulo}</h2>
          {bloco.subtitulo && (
            <p className="text-sm text-zinc-600">{bloco.subtitulo}</p>
          )}
          {config.exibirClienteCabecalho && bloco.cliente && (
            <p className="mt-1 text-sm font-medium text-zinc-800">
              Cliente: {bloco.cliente}
            </p>
          )}
        </div>
        {transporte && (
          <div className="text-right text-xs text-zinc-600">
            <p>Data: {transporte.dataTransporte}</p>
            <p>Placa: {transporte.veiculoAlocado?.placa ?? 'Não alocada'}</p>
            <p>Motorista: {transporte.veiculoAlocado?.motorista ?? '—'}</p>
          </div>
        )}
      </div>
    </header>
  );
}

function TabelaLinhas({ bloco }: { bloco: BlocoMapaImpressao }) {
  return (
    <table className="w-full border-collapse text-left text-xs">
      <thead>
        <tr className="border-b border-zinc-300 bg-zinc-100 text-[10px] uppercase tracking-wider text-zinc-600">
          <th className="px-2 py-1.5">SKU</th>
          <th className="px-2 py-1.5">Descrição</th>
          <th className="px-2 py-1.5">NF</th>
          <th className="px-2 py-1.5">Destinatário</th>
          <th className="px-2 py-1.5">Lote</th>
          <th className="px-2 py-1.5 text-right">Qtd.</th>
          <th className="px-2 py-1.5 text-right">Peso (kg)</th>
          <th className="px-2 py-1.5 text-center">Obs.</th>
        </tr>
      </thead>
      <tbody>
        {bloco.linhas.map((linha) => (
          <tr
            key={`${bloco.id}-${linha.item.id}`}
            className={cn(
              'border-b border-zinc-200',
              linha.quebraPalete && 'border-t-2 border-t-zinc-800',
            )}
          >
            <td className="px-2 py-1.5 font-mono">{linha.item.sku}</td>
            <td className="px-2 py-1.5">{linha.item.descricao ?? '—'}</td>
            <td className="px-2 py-1.5 font-mono">{linha.item.numeroRemessa}</td>
            <td className="px-2 py-1.5">{linha.item.cliente}</td>
            <td className="px-2 py-1.5">{linha.item.lote ?? '—'}</td>
            <td className="px-2 py-1.5 text-right font-mono">
              {linha.item.quantidade.toLocaleString('pt-BR')}{' '}
              {linha.item.unidadeMedida}
            </td>
            <td className="px-2 py-1.5 text-right font-mono">
              {(linha.item.peso ?? 0).toLocaleString('pt-BR')}
            </td>
            <td className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase">
              {formatarObservacaoLinha(linha)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type MapaImpressaoBlocoProps = {
  bloco: BlocoMapaImpressao;
  config: ConfigMapaImpressao;
  className?: string;
  pageBreakBefore?: boolean;
};

export function MapaImpressaoBloco({
  bloco,
  config,
  className,
  pageBreakBefore = false,
}: MapaImpressaoBlocoProps) {
  const pesoTotal = bloco.linhas.reduce(
    (total, linha) => total + (linha.item.peso ?? 0),
    0,
  );

  return (
    <section
      className={cn(
        'break-inside-avoid rounded-lg border border-zinc-300 bg-white p-4 text-zinc-900',
        pageBreakBefore && 'print:break-before-page',
        className,
      )}
    >
      <CabecalhoBloco bloco={bloco} config={config} />
      <TabelaLinhas bloco={bloco} />
      <footer className="mt-3 flex justify-between text-[10px] text-zinc-500">
        <span>
          {bloco.linhas.length} item{bloco.linhas.length !== 1 ? 's' : ''}
        </span>
        <span>Peso total: {pesoTotal.toLocaleString('pt-BR')} kg</span>
      </footer>
    </section>
  );
}
