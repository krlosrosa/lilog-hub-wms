'use client';

import { MapaSeparacaoQr } from '@/features/transporte/components/mapa-separacao-qr';
import {
  ESTRATEGIA_LABELS,
  STATUS_MAPA_LABELS,
  type MapaPickingGerado,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const LIMITE_LINHAS = 10;

type MapaPickingPreviewProps = {
  mapas: MapaPickingGerado[];
};

export function MapaPickingPreview({ mapas }: MapaPickingPreviewProps) {
  if (mapas.length === 0) return null;

  return (
    <div id="preview-mapas-picking" className="space-y-4 text-sm text-zinc-900">
      <div className="border-b border-zinc-300 pb-3">
        <h4 className="text-lg font-bold">MAPAS DE SEPARAÇÃO — PICKING</h4>
        <p className="mt-1 text-xs text-zinc-600">
          {mapas.length} mapa(s) gerado(s) · Estratégia:{' '}
          <strong>{ESTRATEGIA_LABELS[mapas[0]?.estrategia ?? 'discreto']}</strong>
        </p>
      </div>

      {mapas.map((mapa) => {
        const linhasPreview = mapa.linhas.slice(0, LIMITE_LINHAS);
        const restantes = mapa.linhas.length - linhasPreview.length;

        return (
          <div
            key={mapa.id}
            className="bloco rounded border border-zinc-200 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-base font-black text-zinc-900">
                  {mapa.codigo}
                </p>
                <h3 className="text-sm font-bold">{mapa.titulo}</h3>
                <p className="text-xs text-zinc-500">
                  {mapa.qtdPedidos} pedido(s) · {mapa.qtdLinhas} linha(s) ·{' '}
                  {mapa.peso}kg · {mapa.distanciaEstimada}m ·{' '}
                  {mapa.tempoEstimadoMin}min
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Status: {STATUS_MAPA_LABELS[mapa.status]} · Gerado por{' '}
                  {mapa.geradoPor} em{' '}
                  {new Date(mapa.geradoEm).toLocaleString('pt-BR')}
                </p>
                {mapa.onda && (
                  <p className="mt-1 text-xs font-bold text-blue-700">
                    Onda: {mapa.onda}
                  </p>
                )}
                {mapa.zona && (
                  <p className="mt-1 text-xs font-bold text-blue-700">
                    Zona: {mapa.zona}
                  </p>
                )}
                {mapa.agrupamento && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Agrupamento: {mapa.agrupamento}
                  </p>
                )}
              </div>
              <MapaSeparacaoQr
                value={mapa.qrCodeValor}
                label="Abrir no coletor"
                size={72}
              />
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="border border-zinc-200 px-2 py-1 text-left">
                    Seq
                  </th>
                  <th className="border border-zinc-200 px-2 py-1 text-left">
                    Endereço
                  </th>
                  <th className="border border-zinc-200 px-2 py-1 text-left">
                    SKU
                  </th>
                  <th className="border border-zinc-200 px-2 py-1 text-left">
                    Produto
                  </th>
                  <th className="border border-zinc-200 px-2 py-1 text-right">
                    Qtd
                  </th>
                  <th className="border border-zinc-200 px-2 py-1 text-left">
                    Lote
                  </th>
                  {mapa.linhas.some((l) => l.boxDestino) && (
                    <th className="border border-zinc-200 px-2 py-1 text-left">
                      Box
                    </th>
                  )}
                  <th className="border border-zinc-200 px-2 py-1 text-center w-8">
                    ✓
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhasPreview.map((linha) => (
                  <tr key={linha.id}>
                    <td className="border border-zinc-200 px-2 py-1">
                      {linha.sequenciaColeta}
                    </td>
                    <td className="border border-zinc-200 px-2 py-1 font-mono font-bold">
                      {linha.endereco}
                    </td>
                    <td className="border border-zinc-200 px-2 py-1 font-mono">
                      {linha.sku}
                    </td>
                    <td className="border border-zinc-200 px-2 py-1">
                      {linha.produto}
                    </td>
                    <td className="border border-zinc-200 px-2 py-1 text-right font-bold">
                      {linha.quantidade}
                    </td>
                    <td className="border border-zinc-200 px-2 py-1 font-mono text-[10px]">
                      {linha.lote ?? '—'}
                    </td>
                    {mapa.linhas.some((l) => l.boxDestino) && (
                      <td className="border border-zinc-200 px-2 py-1">
                        {linha.boxDestino ?? '—'}
                      </td>
                    )}
                    <td className="border border-zinc-200 px-2 py-1 text-center">
                      <span className="inline-block size-4 border border-zinc-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {restantes > 0 && (
              <p className="mt-2 text-[10px] italic text-zinc-400">
                ... e mais {restantes} linha(s)
              </p>
            )}

            <div className="mt-3 border-t border-zinc-200 pt-2">
              <p className="text-[10px] text-zinc-500">
                Operador: _________________________ Data: ___/___/______
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
