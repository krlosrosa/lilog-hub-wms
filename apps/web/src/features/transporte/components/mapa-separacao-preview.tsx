'use client';

import { MapaSeparacaoQr } from '@/features/transporte/components/mapa-separacao-qr';
import {
  CAMPO_MAPA_LABELS,
  FORMATO_PAPEL_LABELS,
  ORDENACAO_MAPA_LABELS,
  ROTAS_DISPONIVEIS,
  TIPO_SEPARACAO_LABELS,
  type BlocoMapaSeparacao,
  type ConfigEspecificaTipoSeparacao,
  type ConfigImpressaoMapaSeparacao,
  type DemandaEmpilhadeira,
  type ItemSeparacao,
  type TipoSeparacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

type MapaSeparacaoPreviewProps = {
  transporte: TransporteGrupo;
  config: ConfigImpressaoMapaSeparacao;
  blocos: BlocoMapaSeparacao[];
  demandasEmpilhadeira: DemandaEmpilhadeira[];
};

const LIMITE_PREVIEW_ITENS = 8;

type ItemConsolidado = {
  chave: string;
  endereco: string;
  sku: string;
  produto: string;
  quantidade: number;
  pedidos: string[];
};

function formatarDataOnda(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

function consolidarItensOnda(itens: ItemSeparacao[]): ItemConsolidado[] {
  const mapa = new Map<string, ItemConsolidado>();

  itens.forEach((item) => {
    const chave = `${item.endereco}::${item.sku}`;
    const existente = mapa.get(chave);
    if (existente) {
      existente.quantidade += item.quantidade;
      if (!existente.pedidos.includes(item.numeroNF)) {
        existente.pedidos.push(item.numeroNF);
      }
    } else {
      mapa.set(chave, {
        chave,
        endereco: item.endereco,
        sku: item.sku,
        produto: item.produto,
        quantidade: item.quantidade,
        pedidos: [item.numeroNF],
      });
    }
  });

  return [...mapa.values()].sort((a, b) =>
    a.endereco.localeCompare(b.endereco),
  );
}

function resolverBoxDestino(
  item: ItemSeparacao,
  capacidade: number,
  indice: number,
): string {
  const hash = item.remessaId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const box = (hash % capacidade) + 1;
  return `Box ${box}`;
}

function extrairCorredor(endereco: string): string {
  const match = endereco.match(/C(\d+)/i);
  return match ? `Corredor ${match[1]}` : endereco.split('-')[0] ?? endereco;
}

function CabecalhoDiscreto({
  bloco,
  transporte,
  exibirBarcode,
}: {
  bloco: BlocoMapaSeparacao;
  transporte: TransporteGrupo;
  exibirBarcode: boolean;
}) {
  const primeiro = bloco.itens[0];
  const qtdTotal = bloco.itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">
            Pedido:{' '}
            <span className="font-mono font-bold text-zinc-900">
              {primeiro?.numeroNF ?? bloco.agrupador}
            </span>
          </p>
          <p className="text-xs text-zinc-600">
            Cliente: <strong>{primeiro?.destinoCliente ?? '—'}</strong>
          </p>
          <p className="text-xs text-zinc-600">
            Doca destino:{' '}
            <span className="font-mono">{bloco.destinoAlocacao}</span> · Qtd
            total: <strong>{qtdTotal} un.</strong>
          </p>
        </div>
        {exibirBarcode && primeiro && (
          <div className="text-center">
            <div className="rounded border border-zinc-300 bg-white px-3 py-1 font-mono text-[10px] tracking-widest">
              ||| {primeiro.numeroNF} |||
            </div>
            <p className="mt-0.5 text-[9px] text-zinc-500">ID do Pedido</p>
          </div>
        )}
      </div>
      <h3 className="text-sm font-bold text-zinc-900">{bloco.titulo}</h3>
      {bloco.subtitulo && (
        <p className="text-xs text-zinc-500">{bloco.subtitulo}</p>
      )}
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoZona({
  bloco,
  configEspecifica,
}: {
  bloco: BlocoMapaSeparacao;
  configEspecifica: ConfigEspecificaTipoSeparacao;
}) {
  const zonaNome = bloco.agrupador.toUpperCase();
  const pedidosUnicos = new Set(bloco.itens.map((i) => i.numeroNF)).size;

  return (
    <div className="mb-3 space-y-2">
      <div className="rounded bg-blue-600 px-4 py-2 text-center">
        <p className="text-lg font-black tracking-wider text-white">
          {zonaNome}
        </p>
      </div>
      <p className="text-xs text-zinc-600">
        Pedido principal:{' '}
        <span className="font-mono font-bold">
          {bloco.itens[0]?.numeroNF ?? '—'}
        </span>{' '}
        · Sub-pedido zona:{' '}
        <span className="font-mono">{bloco.id}</span>
      </p>
      <p className="text-xs text-zinc-500">
        {pedidosUnicos} pedido(s) · {bloco.itens.length} linha(s)
        {configEspecifica.tipo === 'zona' &&
          configEspecifica.consolidacaoZona === 'zona_anterior' &&
          ' · Aguarda zona anterior'}
      </p>
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoOnda({
  bloco,
  indice,
}: {
  bloco: BlocoMapaSeparacao;
  indice: number;
}) {
  const pedidosUnicos = new Set(bloco.itens.map((i) => i.numeroNF)).size;
  const numeroOnda = `ONDA-${formatarDataOnda()}-${String(indice + 1).padStart(2, '0')}`;

  return (
    <div className="mb-3 space-y-2">
      <div className="rounded border-2 border-zinc-800 bg-zinc-100 px-4 py-2">
        <p className="font-mono text-base font-black text-zinc-900">
          {numeroOnda}
        </p>
        <p className="text-xs text-zinc-600">
          {pedidosUnicos} pedidos consolidados · {bloco.itens.length} linhas
          originais
        </p>
      </div>
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoCluster({
  bloco,
  configEspecifica,
}: {
  bloco: BlocoMapaSeparacao;
  configEspecifica: ConfigEspecificaTipoSeparacao;
}) {
  const pedidosUnicos = new Set(bloco.itens.map((i) => i.numeroNF)).size;
  const capacidade =
    configEspecifica.tipo === 'cluster'
      ? configEspecifica.capacidadeCarrinho
      : 6;

  return (
    <div className="mb-3 space-y-2">
      <h3 className="text-base font-black text-zinc-900">
        CLUSTER — {pedidosUnicos} pedidos simultâneos
      </h3>
      <p className="text-xs text-zinc-600">
        Carrinho com {capacidade} posições (Box 1 a Box {capacidade})
      </p>
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoCorredor({ bloco }: { bloco: BlocoMapaSeparacao }) {
  const corredor = extrairCorredor(bloco.agrupador);

  return (
    <div className="mb-3 space-y-2">
      <div className="flex items-center gap-3">
        <span className="rounded bg-zinc-800 px-4 py-2 font-mono text-2xl font-black text-white">
          {corredor}
        </span>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">{bloco.titulo}</h3>
          <p className="text-xs text-zinc-500">
            {bloco.itens.length} item(ns) neste bloco
          </p>
        </div>
      </div>
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoProduto({
  bloco,
  exibirBarcode,
}: {
  bloco: BlocoMapaSeparacao;
  exibirBarcode: boolean;
}) {
  const sku = bloco.agrupador;
  const qtdTotal = bloco.itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div className="mb-3 space-y-2">
      <h3 className="text-sm font-bold text-zinc-900">
        SKU: <span className="font-mono">{sku}</span>
      </h3>
      <p className="text-xs text-zinc-600">
        {bloco.itens[0]?.produto ?? '—'} ·{' '}
        <strong className="text-lg">{qtdTotal} un.</strong> a coletar
      </p>
      {exibirBarcode && (
        <div className="rounded border-2 border-zinc-800 bg-white px-6 py-3 text-center">
          <p className="font-mono text-2xl font-black tracking-[0.3em] text-zinc-900">
            {sku.replace('SKU-', '789')}
          </p>
          <p className="mt-1 text-[10px] text-zinc-500">Código de barras SKU</p>
        </div>
      )}
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoRota({
  bloco,
  transporte,
  configEspecifica,
  indice,
  totalBlocos,
}: {
  bloco: BlocoMapaSeparacao;
  transporte: TransporteGrupo;
  configEspecifica: ConfigEspecificaTipoSeparacao;
  indice: number;
  totalBlocos: number;
}) {
  const rotaLabel =
    configEspecifica.tipo === 'rota'
      ? (ROTAS_DISPONIVEIS.find((r) => r.id === configEspecifica.rotaId)
          ?.label ?? configEspecifica.rotaId)
      : transporte.rota;

  return (
    <div className="mb-3 space-y-2">
      <p className="font-mono text-sm font-bold text-zinc-900">
        {rotaLabel}
      </p>
      <p className="text-xs text-zinc-600">
        Motorista / Transportadora:{' '}
        <strong>{transporte.veiculoAlocado?.motorista ?? 'A definir'}</strong>
      </p>
      <p className="rounded bg-zinc-100 px-3 py-1 font-mono text-xs font-bold text-zinc-800">
        PALETE {indice + 1} / {totalBlocos} — {transporte.rota.toUpperCase()}
      </p>
      <h3 className="text-sm font-bold text-zinc-900">{bloco.titulo}</h3>
      {bloco.subtitulo && (
        <p className="text-xs text-zinc-500">{bloco.subtitulo}</p>
      )}
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoEndereco({ bloco }: { bloco: BlocoMapaSeparacao }) {
  return (
    <div className="mb-3 space-y-2">
      <h3 className="text-sm font-bold text-zinc-900">{bloco.titulo}</h3>
      {bloco.subtitulo && (
        <p className="text-xs text-zinc-500">{bloco.subtitulo}</p>
      )}
      <p className="text-xs text-zinc-600">
        Ordenação geoespacial — menor distância linear
      </p>
      {bloco.operador && (
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Operador: {bloco.operador}
        </p>
      )}
    </div>
  );
}

function CabecalhoGenerico({
  bloco,
  transporte,
}: {
  bloco: BlocoMapaSeparacao;
  transporte: TransporteGrupo;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-zinc-900">{bloco.titulo}</h3>
        {bloco.subtitulo && (
          <p className="text-xs text-zinc-500">{bloco.subtitulo}</p>
        )}
        {bloco.operador && (
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Operador: {bloco.operador}
          </p>
        )}
        <p className="mt-1 text-xs font-semibold text-zinc-700">
          Alocar em:{' '}
          <span className="font-mono">{bloco.destinoAlocacao}</span>
        </p>
        {bloco.possuiPaleteFechado && (
          <p className="mt-1 text-[10px] font-bold uppercase text-amber-700">
            Contém palete fechado — demanda de empilhadeira gerada
          </p>
        )}
      </div>
      <MapaSeparacaoQr
        value={bloco.qrCodeValor}
        label="Validar mapa"
        size={64}
      />
    </div>
  );
}

function renderCabecalhoBloco(
  bloco: BlocoMapaSeparacao,
  tipoSeparacao: TipoSeparacao,
  configEspecifica: ConfigEspecificaTipoSeparacao,
  transporte: TransporteGrupo,
  indice: number,
  totalBlocos: number,
  exibirBarcode: boolean,
) {
  switch (tipoSeparacao) {
    case 'discreto':
      return (
        <CabecalhoDiscreto
          bloco={bloco}
          transporte={transporte}
          exibirBarcode={exibirBarcode}
        />
      );
    case 'zona':
      return <CabecalhoZona bloco={bloco} configEspecifica={configEspecifica} />;
    case 'onda':
      return <CabecalhoOnda bloco={bloco} indice={indice} />;
    case 'cluster':
      return (
        <CabecalhoCluster bloco={bloco} configEspecifica={configEspecifica} />
      );
    case 'corredor':
      return <CabecalhoCorredor bloco={bloco} />;
    case 'produto':
      return (
        <CabecalhoProduto bloco={bloco} exibirBarcode={exibirBarcode} />
      );
    case 'rota':
      return (
        <CabecalhoRota
          bloco={bloco}
          transporte={transporte}
          configEspecifica={configEspecifica}
          indice={indice}
          totalBlocos={totalBlocos}
        />
      );
    case 'endereco':
      return <CabecalhoEndereco bloco={bloco} />;
    default:
      return <CabecalhoGenerico bloco={bloco} transporte={transporte} />;
  }
}

function renderRodapeBloco(
  bloco: BlocoMapaSeparacao,
  tipoSeparacao: TipoSeparacao,
) {
  if (tipoSeparacao === 'zona') {
    return (
      <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <strong>Destino após separação:</strong> Esteira Central / Área de
        Consolidação — {bloco.destinoAlocacao}
      </div>
    );
  }

  if (tipoSeparacao === 'discreto') {
    return (
      <p className="mt-2 text-[10px] text-zinc-500">
        Alocar em:{' '}
        <span className="font-mono">{bloco.destinoAlocacao}</span>
        {bloco.possuiPaleteFechado &&
          ' · Contém palete fechado — demanda de empilhadeira gerada'}
      </p>
    );
  }

  return null;
}

type TabelaProps = {
  bloco: BlocoMapaSeparacao;
  config: ConfigImpressaoMapaSeparacao;
  exibirPeso: boolean;
  exibirVolume: boolean;
  exibirDestino: boolean;
  exibirObservacoes: boolean;
  exibirBarcode: boolean;
};

function TabelaDiscreto({
  bloco,
  config,
  exibirPeso,
  exibirVolume,
  exibirDestino,
  exibirObservacoes,
  exibirBarcode,
}: TabelaProps) {
  const itens = bloco.itens.slice(0, LIMITE_PREVIEW_ITENS);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">#</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Descrição
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-right">Qtd</th>
          {exibirPeso && (
            <th className="border border-zinc-200 px-2 py-1 text-right">Peso</th>
          )}
          {exibirDestino && (
            <th className="border border-zinc-200 px-2 py-1 text-left">
              Cliente
            </th>
          )}
          {exibirObservacoes && (
            <th className="border border-zinc-200 px-2 py-1 text-left">Obs.</th>
          )}
          {exibirBarcode && (
            <th className="border border-zinc-200 px-2 py-1 text-left">EAN</th>
          )}
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, index) => (
          <tr key={item.id}>
            <td className="border border-zinc-200 px-2 py-1">{index + 1}</td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1">{item.produto}</td>
            <td className="border border-zinc-200 px-2 py-1 text-right font-bold">
              {item.quantidade}
            </td>
            {exibirPeso && (
              <td className="border border-zinc-200 px-2 py-1 text-right">
                {item.peso}kg
              </td>
            )}
            {exibirDestino && (
              <td className="border border-zinc-200 px-2 py-1">
                {item.destinoCliente}
              </td>
            )}
            {exibirObservacoes && (
              <td className="border border-zinc-200 px-2 py-1">
                {item.observacoes ?? '—'}
              </td>
            )}
            {exibirBarcode && (
              <td className="border border-zinc-200 px-2 py-1 font-mono">
                {item.sku.replace('SKU-', '789')}
              </td>
            )}
            <td className="border border-zinc-200 px-2 py-1 text-center">
              <span className="inline-block size-4 border border-zinc-400" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaOnda({ bloco }: { bloco: BlocoMapaSeparacao }) {
  const consolidados = consolidarItensOnda(bloco.itens).slice(
    0,
    LIMITE_PREVIEW_ITENS,
  );

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Descrição
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-right">
            Qtd Total
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Pedidos
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        {consolidados.map((item) => (
          <tr key={item.chave}>
            <td className="border border-zinc-200 px-2 py-1 font-mono font-bold">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1">{item.produto}</td>
            <td className="border border-zinc-200 px-2 py-1 text-right text-base font-black">
              {item.quantidade}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-[10px]">
              {item.pedidos.join(', ')}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-center">
              <span className="inline-block size-4 border border-zinc-400" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaCluster({
  bloco,
  config,
}: {
  bloco: BlocoMapaSeparacao;
  config: ConfigImpressaoMapaSeparacao;
}) {
  const capacidade =
    config.configEspecifica.tipo === 'cluster'
      ? config.configEspecifica.capacidadeCarrinho
      : 6;
  const itens = bloco.itens.slice(0, LIMITE_PREVIEW_ITENS);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-right">Qtd</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Box Destino
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, index) => (
          <tr key={item.id}>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-right font-bold">
              {item.quantidade}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                {resolverBoxDestino(item, capacidade, index)}
              </span>
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-center">
              <span className="inline-block size-4 border border-zinc-400" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaCorredor({ bloco }: { bloco: BlocoMapaSeparacao }) {
  const itens = bloco.itens.slice(0, LIMITE_PREVIEW_ITENS);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Corredor
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Produto
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-right">Qtd</th>
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, index) => (
          <tr key={item.id}>
            <td className="border border-zinc-200 px-2 py-1 font-mono text-base font-black">
              {extrairCorredor(item.endereco)}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono text-sm font-bold">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1">{item.produto}</td>
            <td className="border border-zinc-200 px-2 py-1 text-right">
              {item.quantidade}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-center">
              <span className="inline-block size-4 border border-zinc-400" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaProduto({ bloco }: { bloco: BlocoMapaSeparacao }) {
  const qtdTotal = bloco.itens.reduce((acc, i) => acc + i.quantidade, 0);
  const item = bloco.itens[0];

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Descrição
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-right">
            Qtd Massiva
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-zinc-200 px-2 py-1 font-mono text-sm font-bold">
            {item?.sku ?? bloco.agrupador}
          </td>
          <td className="border border-zinc-200 px-2 py-1">
            {item?.produto ?? '—'}
          </td>
          <td className="border border-zinc-200 px-2 py-1 font-mono">
            {item?.endereco ?? '—'}
          </td>
          <td className="border border-zinc-200 px-2 py-1 text-right text-xl font-black">
            {qtdTotal}
          </td>
          <td className="border border-zinc-200 px-2 py-1 text-center">
            <span className="inline-block size-4 border border-zinc-400" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function TabelaRota({
  bloco,
  exibirPeso,
  exibirVolume,
}: {
  bloco: BlocoMapaSeparacao;
  exibirPeso: boolean;
  exibirVolume: boolean;
}) {
  const porCliente = new Map<string, ItemSeparacao[]>();
  bloco.itens.forEach((item) => {
    const atual = porCliente.get(item.destinoCliente) ?? [];
    atual.push(item);
    porCliente.set(item.destinoCliente, atual);
  });

  const grupos = [...porCliente.entries()].slice(0, 3);

  return (
    <div className="space-y-3">
      {grupos.map(([cliente, itens]) => (
        <div key={cliente}>
          <p className="mb-1 rounded bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-800">
            Parada: {cliente}
          </p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50">
                <th className="border border-zinc-200 px-2 py-1 text-left">
                  Endereço
                </th>
                <th className="border border-zinc-200 px-2 py-1 text-left">
                  SKU
                </th>
                <th className="border border-zinc-200 px-2 py-1 text-right">
                  Qtd
                </th>
                {exibirPeso && (
                  <th className="border border-zinc-200 px-2 py-1 text-right">
                    Peso
                  </th>
                )}
                {exibirVolume && (
                  <th className="border border-zinc-200 px-2 py-1 text-right">
                    Vol
                  </th>
                )}
                <th className="border border-zinc-200 px-2 py-1 text-center w-10">
                  ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {itens.slice(0, 4).map((item) => (
                <tr key={item.id}>
                  <td className="border border-zinc-200 px-2 py-1 font-mono">
                    {item.endereco}
                  </td>
                  <td className="border border-zinc-200 px-2 py-1 font-mono">
                    {item.sku}
                  </td>
                  <td className="border border-zinc-200 px-2 py-1 text-right">
                    {item.quantidade}
                  </td>
                  {exibirPeso && (
                    <td className="border border-zinc-200 px-2 py-1 text-right">
                      {item.peso}kg
                    </td>
                  )}
                  {exibirVolume && (
                    <td className="border border-zinc-200 px-2 py-1 text-right">
                      {item.volume}m³
                    </td>
                  )}
                  <td className="border border-zinc-200 px-2 py-1 text-center">
                    <span className="inline-block size-4 border border-zinc-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function TabelaEndereco({
  bloco,
  exibirPeso,
  exibirVolume,
}: {
  bloco: BlocoMapaSeparacao;
  exibirPeso: boolean;
  exibirVolume: boolean;
}) {
  const itens = bloco.itens.slice(0, LIMITE_PREVIEW_ITENS);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left text-sm font-bold">
            Endereço
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">
            Produto
          </th>
          <th className="border border-zinc-200 px-2 py-1 text-right">Qtd</th>
          {exibirPeso && (
            <th className="border border-zinc-200 px-2 py-1 text-right">Peso</th>
          )}
          {exibirVolume && (
            <th className="border border-zinc-200 px-2 py-1 text-right">Vol</th>
          )}
          <th className="border border-zinc-200 px-2 py-1 text-center w-10">
            ✓
          </th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, index) => (
          <tr key={item.id}>
            <td className="border border-zinc-200 px-2 py-1 font-mono text-base font-bold">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono text-xs">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-xs">
              {item.produto}
            </td>
            <td className="border border-zinc-200 px-2 py-1 text-right font-bold">
              {item.quantidade}
            </td>
            {exibirPeso && (
              <td className="border border-zinc-200 px-2 py-1 text-right">
                {item.peso}kg
              </td>
            )}
            {exibirVolume && (
              <td className="border border-zinc-200 px-2 py-1 text-right">
                {item.volume}m³
              </td>
            )}
            <td className="border border-zinc-200 px-2 py-1 text-center">
              <span className="inline-block size-4 border border-zinc-400" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TabelaGenerica({
  bloco,
  config,
  exibirPeso,
  exibirVolume,
  exibirDestino,
  exibirObservacoes,
  exibirBarcode,
}: TabelaProps) {
  const itens = bloco.itens.slice(0, LIMITE_PREVIEW_ITENS);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border border-zinc-200 px-2 py-1 text-left">#</th>
          {config.tipoSeparacao !== 'produto' && (
            <th className="border border-zinc-200 px-2 py-1 text-left">Pedido</th>
          )}
          <th className="border border-zinc-200 px-2 py-1 text-left">Endereço</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">SKU</th>
          <th className="border border-zinc-200 px-2 py-1 text-left">Produto</th>
          <th className="border border-zinc-200 px-2 py-1 text-right">Qtd</th>
          {exibirPeso && (
            <th className="border border-zinc-200 px-2 py-1 text-right">Peso</th>
          )}
          {exibirVolume && (
            <th className="border border-zinc-200 px-2 py-1 text-right">Vol</th>
          )}
          {exibirDestino && (
            <th className="border border-zinc-200 px-2 py-1 text-left">
              Cliente
            </th>
          )}
          {exibirObservacoes && (
            <th className="border border-zinc-200 px-2 py-1 text-left">Obs.</th>
          )}
          {exibirBarcode && (
            <th className="border border-zinc-200 px-2 py-1 text-left">EAN</th>
          )}
        </tr>
      </thead>
      <tbody>
        {itens.map((item, index) => (
          <tr key={item.id}>
            <td className="border border-zinc-200 px-2 py-1">{index + 1}</td>
            {config.tipoSeparacao !== 'produto' && (
              <td className="border border-zinc-200 px-2 py-1 font-mono">
                {item.numeroNF}
              </td>
            )}
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.endereco}
            </td>
            <td className="border border-zinc-200 px-2 py-1 font-mono">
              {item.sku}
            </td>
            <td className="border border-zinc-200 px-2 py-1">{item.produto}</td>
            <td className="border border-zinc-200 px-2 py-1 text-right">
              {item.quantidade}
            </td>
            {exibirPeso && (
              <td className="border border-zinc-200 px-2 py-1 text-right">
                {item.peso}kg
              </td>
            )}
            {exibirVolume && (
              <td className="border border-zinc-200 px-2 py-1 text-right">
                {item.volume}m³
              </td>
            )}
            {exibirDestino && (
              <td className="border border-zinc-200 px-2 py-1">
                {item.destinoCliente}
              </td>
            )}
            {exibirObservacoes && (
              <td className="border border-zinc-200 px-2 py-1">
                {item.observacoes ?? '—'}
              </td>
            )}
            {exibirBarcode && (
              <td className="border border-zinc-200 px-2 py-1 font-mono">
                {item.sku.replace('SKU-', '789')}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderTabelaBloco(props: TabelaProps) {
  const { config, bloco, exibirPeso, exibirVolume } = props;

  switch (config.tipoSeparacao) {
    case 'discreto':
      return <TabelaDiscreto {...props} />;
    case 'onda':
      return <TabelaOnda bloco={bloco} />;
    case 'cluster':
      return <TabelaCluster bloco={bloco} config={config} />;
    case 'corredor':
      return <TabelaCorredor bloco={bloco} />;
    case 'produto':
      return <TabelaProduto bloco={bloco} />;
    case 'rota':
      return (
        <TabelaRota
          bloco={bloco}
          exibirPeso={exibirPeso}
          exibirVolume={exibirVolume}
        />
      );
    case 'endereco':
      return (
        <TabelaEndereco
          bloco={bloco}
          exibirPeso={exibirPeso}
          exibirVolume={exibirVolume}
        />
      );
    default:
      return <TabelaGenerica {...props} />;
  }
}

export function MapaSeparacaoPreview({
  transporte,
  config,
  blocos,
  demandasEmpilhadeira,
}: MapaSeparacaoPreviewProps) {
  const exibirPeso = config.campos.includes('peso');
  const exibirVolume = config.campos.includes('volume');
  const exibirDestino = config.campos.includes('destino');
  const exibirObservacoes = config.campos.includes('observacoes');
  const exibirBarcode = config.campos.includes('barcode');

  const tabelaProps: TabelaProps = {
    bloco: blocos[0] ?? {
      id: '',
      titulo: '',
      agrupador: '',
      itens: [],
      folhas: 0,
      destinoAlocacao: '',
      qrCodeValor: '',
      possuiPaleteFechado: false,
    },
    config,
    exibirPeso,
    exibirVolume,
    exibirDestino,
    exibirObservacoes,
    exibirBarcode,
  };

  return (
    <div id="preview-mapa-separacao" className="space-y-4 text-sm text-zinc-900">
      <div className="border-b border-zinc-300 pb-3">
        <h4 className="text-lg font-bold">MAPA DE SEPARAÇÃO</h4>
        <p className="mt-1 text-xs text-zinc-600">
          Transporte: <strong>{transporte.id}</strong> — {transporte.rota} |
          Placa: {transporte.veiculoAlocado?.placa ?? 'Não alocada'}
        </p>
        <p className="text-xs text-zinc-600">
          Tipo: <strong>{TIPO_SEPARACAO_LABELS[config.tipoSeparacao]}</strong> |
          Ordenação: {ORDENACAO_MAPA_LABELS[config.ordenacao]} | Formato:{' '}
          {FORMATO_PAPEL_LABELS[config.formatoPapel]} | {blocos.length} mapa(s)
        </p>
      </div>

      {blocos.map((bloco, indice) => {
        const itensRestantes = Math.max(
          0,
          bloco.itens.length - LIMITE_PREVIEW_ITENS,
        );

        return (
          <div
            key={bloco.id}
            className="bloco rounded border border-zinc-200 p-3"
            style={
              config.tipoSeparacao === 'corredor'
                ? { pageBreakInside: 'avoid' }
                : undefined
            }
          >
            {renderCabecalhoBloco(
              bloco,
              config.tipoSeparacao,
              config.configEspecifica,
              transporte,
              indice,
              blocos.length,
              exibirBarcode,
            )}

            {config.tipoSeparacao !== 'discreto' &&
              config.tipoSeparacao !== 'zona' &&
              config.tipoSeparacao !== 'produto' && (
                <div className="mb-2 flex justify-end">
                  <MapaSeparacaoQr
                    value={bloco.qrCodeValor}
                    label="Validar mapa"
                    size={56}
                  />
                </div>
              )}

            {renderTabelaBloco({ ...tabelaProps, bloco })}

            {itensRestantes > 0 && (
              <p className="mt-2 text-[10px] italic text-zinc-400">
                ... e mais {itensRestantes} item(ns) neste mapa
                {bloco.folhas > 1 ? ` · ${bloco.folhas} folha(s)` : ''}
              </p>
            )}

            {renderRodapeBloco(bloco, config.tipoSeparacao)}
          </div>
        );
      })}

      {demandasEmpilhadeira.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3">
          <h3 className="text-sm font-bold text-amber-900">
            Demandas automáticas — Operador de Empilhadeira
          </h3>
          <p className="mb-3 text-xs text-amber-800">
            Paletes fechados detectados. As demandas abaixo foram geradas
            automaticamente para movimentação.
          </p>
          <div className="space-y-2">
            {demandasEmpilhadeira.map((demanda) => (
              <div
                key={demanda.id}
                className="flex items-start justify-between gap-3 rounded border border-amber-200 bg-white p-2"
              >
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-zinc-900">
                    NF {demanda.numeroNF}
                  </p>
                  <p className="text-zinc-600">
                    <strong>De:</strong> {demanda.origem}
                  </p>
                  <p className="text-zinc-600">
                    <strong>Para:</strong> {demanda.destino}
                  </p>
                  <p className="text-zinc-500">
                    {demanda.peso}kg · {demanda.volume}m³ · {demanda.motivo}
                  </p>
                </div>
                <MapaSeparacaoQr
                  value={demanda.qrCodeValor}
                  label="Validar demanda"
                  size={56}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-zinc-500">
        Pré-visualização — {config.copias} cópia(s) |{' '}
        {FORMATO_PAPEL_LABELS[config.formatoPapel]} | Campos:{' '}
        {config.campos.map((campo) => CAMPO_MAPA_LABELS[campo]).join(', ')}
      </p>
    </div>
  );
}
