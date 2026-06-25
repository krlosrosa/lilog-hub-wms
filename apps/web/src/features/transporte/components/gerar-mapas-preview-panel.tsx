'use client';

import { useCallback, useMemo, useState } from 'react';

import { montarVariaveisCabecalhoMapa, QR_CODE_VARIAVEL } from '@lilog/contracts';
import { Button, cn } from '@lilog/ui';
import { Check, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import type {
  GerarMapasResponse,
  GrupoMapaApi,
  MapaEtapaPayload,
} from '@/features/transporte/lib/gerar-mapas-api';
import { ConferenciaPreviewTable } from '@/features/transporte/components/conferencia-preview-table';
import { CarregamentoPreviewPanel } from '@/features/transporte/components/carregamento-preview-panel';
import {
  AGRUPAMENTO_CONFERENCIA_LABELS,
  CLASSIFICAR_POR_CONFERENCIA_LABELS,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { aplicarQuebraPaleteItens } from '@/features/transporte/lib/aplicar-quebra-palete-grupos';
import { calcularBreakdownQuantidade } from '@/features/transporte/lib/calcular-breakdown-quantidade';
import { consolidarItensPorSkuLote } from '@/features/transporte/lib/consolidar-itens-mapa';
import {
  montarCabecalhoGrupo,
  type TransporteMetaMapa,
} from '@/features/transporte/lib/montar-cabecalho-grupo-mapa';
import { montarGruposMapaConferencia } from '@/features/transporte/lib/montar-grupos-mapa-conferencia';
import { ordenarItensPickway } from '@/features/transporte/lib/ordenar-itens-pickway';
import {
  segregarItensConsolidados,
  type ItemMapaSegregavel,
} from '@/features/transporte/lib/segregar-itens-mapa';
import type {
  BlocoMapaImpressao,
  ConfigMapaImpressao,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

type PreviewEtapa = 'separacao' | 'conferencia' | 'carregamento';

type GerarMapasPreviewPanelProps = {
  blocos: BlocoMapaImpressao[];
  gruposGerados: GerarMapasResponse | null;
  config: ConfigMapaImpressao;
  transportes: TransporteGrupo[];
  inicializado: boolean;
  temTransportes: boolean;
};

function transporteGrupoParaMeta(transporte: TransporteGrupo): TransporteMetaMapa {
  return {
    id: transporte.id,
    rota: transporte.rota,
    placa: transporte.veiculoAlocado?.placa ?? null,
    transportadora:
      transporte.veiculoAlocado?.transportadora ??
      transporte.transportadoraAtribuida ??
      null,
  };
}

function coletarTransportesMetaDeBlocos(
  blocos: BlocoMapaImpressao[],
): Map<string, TransporteMetaMapa> {
  const map = new Map<string, TransporteMetaMapa>();

  blocos.forEach((bloco) => {
    if (bloco.transporte) {
      map.set(bloco.transporte.id, transporteGrupoParaMeta(bloco.transporte));
    }

    bloco.linhas.forEach((linha) => {
      if (!map.has(linha.transporteId)) {
        map.set(linha.transporteId, {
          id: linha.transporteId,
          rota: linha.transporteRota,
          placa: null,
          transportadora: null,
        });
      }
    });
  });

  return map;
}

function projetarItens(itens: ItemMapaSegregavel[]) {
  return itens.map((item) => ({
    sku: item.sku,
    descricao: item.descricao,
    remessa: item.remessa,
    cliente: item.cliente,
    codCliente: item.codCliente,
    empresa: item.empresa,
    categoria: item.categoria,
    lote: item.lote,
    dataFabricacao: item.dataFabricacao,
    faixa: item.faixa,
    quantidade: item.quantidade,
    unidadeMedida: item.unidadeMedida,
    quantidadeNormalizadaUnidades: item.quantidadeNormalizadaUnidades,
    peso: item.peso,
    endereco: item.endereco ?? null,
    breakdown: calcularBreakdownQuantidade(
      item.quantidadeNormalizadaUnidades,
      item.unidadesPorCaixa,
      item.caixasPorPalete,
      item.pesoBrutoUnidade,
      item.pesoBrutoCaixa,
      item.pesoBrutoPalete,
      item.pesoLiquidoUnidade,
      item.pesoLiquidoCaixa,
      item.pesoLiquidoPalete,
    ),
  }));
}

function mapearLinhaParaItemSegregavel(
  linha: BlocoMapaImpressao['linhas'][number],
): ItemMapaSegregavel {
  return {
    sku: linha.item.sku,
    descricao: linha.item.descricao,
    remessa: linha.item.numeroRemessa,
    cliente: linha.item.cliente,
    codCliente: linha.item.codCliente,
    empresa: linha.item.empresa,
    categoria: linha.item.categoria,
    lote: linha.item.lote,
    dataFabricacao: linha.item.dataFabricacao ?? null,
    faixa: linha.item.faixa ?? null,
    quantidade: linha.item.quantidade,
    unidadeMedida: linha.item.unidadeMedida,
    quantidadeNormalizadaUnidades: linha.item.quantidadeNormalizadaUnidades,
    peso: linha.item.peso,
    unidadesPorCaixa: linha.item.unidadesPorCaixa,
    caixasPorPalete: linha.item.caixasPorPalete,
    pesoBrutoUnidade: linha.item.pesoBrutoUnidade,
    pesoBrutoCaixa: linha.item.pesoBrutoCaixa,
    pesoBrutoPalete: linha.item.pesoBrutoPalete,
    pesoLiquidoUnidade: linha.item.pesoLiquidoUnidade,
    pesoLiquidoCaixa: linha.item.pesoLiquidoCaixa,
    pesoLiquidoPalete: linha.item.pesoLiquidoPalete,
    endereco: linha.item.endereco,
    enderecoId: linha.item.enderecoId,
    zona: linha.item.zona,
    rua: linha.item.rua,
    posicao: linha.item.posicao,
    nivel: linha.item.nivel,
    prioridadePicking: linha.item.prioridadePicking,
    slottingOrdem: linha.item.slottingOrdem,
    slottingPapel: linha.item.slottingPapel,
  };
}

function projetarBlocosParaJson(
  blocos: BlocoMapaImpressao[],
  config: ConfigMapaImpressao,
  transportesPorId: Map<string, TransporteMetaMapa>,
): MapaEtapaPayload['grupos'] {
  return blocos.flatMap((bloco) => {
    const itensBrutos: ItemMapaSegregavel[] = bloco.linhas.map((linha) =>
      mapearLinhaParaItemSegregavel(linha),
    );

    const itensConsolidados = consolidarItensPorSkuLote(itensBrutos);
    const itensOrdenados = ordenarItensPickway(itensConsolidados);
    const gruposSegregados = segregarItensConsolidados(itensOrdenados, {
      segregarPaleteFull: config.segregarPaleteFull,
      segregarUnidade: config.segregarUnidade,
    });

    return gruposSegregados.flatMap((grupo) => {
      const tituloBase = `${bloco.titulo}${grupo.sufixoTitulo}`;
      const partesItens =
        grupo.idSuffix === '' && config.quebraPalete.ativo
          ? aplicarQuebraPaleteItens(grupo.itens, config.quebraPalete)
          : [grupo.itens];

      return partesItens
        .map((parteItens, index) => {
          const itens = projetarItens(parteItens);

          if (itens.length === 0) {
            return null;
          }

          const parteNumero = index + 1;
          const sufixoParte =
            partesItens.length > 1 ? ` — Parte ${parteNumero}` : '';
          const titulo = `${tituloBase}${sufixoParte}`;

          const cabecalho = montarCabecalhoGrupo(
            {
              titulo: bloco.titulo,
              empresa: bloco.empresa,
              categoria: bloco.categoria,
              linhas: bloco.linhas.map((linha) => ({
                transporteId: linha.transporteId,
                transporteRota: linha.transporteRota,
                codCliente: linha.item.codCliente,
                cliente: linha.item.cliente,
              })),
            },
            itens,
            titulo,
            transportesPorId,
            parteItens.map((item) => ({ caixasPorPalete: item.caixasPorPalete })),
          );

          return {
            id: cabecalho.microUuid,
            titulo,
            subtitulo: bloco.subtitulo,
            totalItens: itens.length,
            pesoTotal: itens.reduce((total, item) => total + (item.peso ?? 0), 0),
            cabecalho,
            itens,
          };
        })
        .filter((grupoProjetado): grupoProjetado is NonNullable<typeof grupoProjetado> =>
          grupoProjetado !== null,
        );
    });
  });
}

function labelAgrupamento(config: ConfigMapaImpressao): string {
  return config.tipoDadosBasicos === 'cliente' ? 'Por cliente' : 'Por transporte';
}

function formatarPeso(peso: number): string {
  return `${peso.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

type GrupoPreviewRowProps = {
  grupo: GrupoMapaApi;
  index: number;
};

function GrupoPreviewRow({ grupo, index }: GrupoPreviewRowProps) {
  const [expandido, setExpandido] = useState(false);
  const [copiado, setCopiado] = useState<'cabecalho' | 'grupo' | 'itens' | null>(
    null,
  );

  const cab = grupo.cabecalho;

  const cabecalhoJson = useMemo(
    () => JSON.stringify(grupo.cabecalho, null, 2),
    [grupo.cabecalho],
  );

  const variaveisResolvidas = useMemo(() => {
    if (!cab) {
      return [];
    }

    const mapa = montarVariaveisCabecalhoMapa(cab, { sequencia: index + 1 });

    return Object.entries(mapa)
      .filter(([chave]) => chave !== QR_CODE_VARIAVEL)
      .map(([chave, valor]) => ({ chave, valor: valor || '—' }));
  }, [cab, index]);

  const variaveisResolvidasJson = useMemo(
    () => JSON.stringify(Object.fromEntries(variaveisResolvidas.map((v) => [v.chave, v.valor])), null, 2),
    [variaveisResolvidas],
  );

  const itensJson = useMemo(
    () => JSON.stringify(grupo.itens, null, 2),
    [grupo.itens],
  );

  const grupoJson = useMemo(() => JSON.stringify(grupo, null, 2), [grupo]);

  const copiar = useCallback(
    async (tipo: 'cabecalho' | 'grupo' | 'itens') => {
      const texto =
        tipo === 'cabecalho'
          ? cabecalhoJson
          : tipo === 'grupo'
            ? grupoJson
            : itensJson;

      try {
        await navigator.clipboard.writeText(texto);
        setCopiado(tipo);
        toast.success(
          tipo === 'cabecalho'
            ? 'Cabeçalho copiado.'
            : tipo === 'grupo'
              ? 'Grupo completo copiado.'
              : 'Itens copiados.',
        );
        setTimeout(() => setCopiado(null), 2000);
      } catch {
        toast.error('Não foi possível copiar.');
      }
    },
    [cabecalhoJson, grupoJson, itensJson],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80">
      <div className="flex items-center gap-1 border-b border-zinc-800/80 bg-zinc-900/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-zinc-800/60"
          aria-expanded={expandido}
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-zinc-400 transition-transform',
              expandido && 'rotate-90',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-zinc-100">
                {grupo.titulo || `Grupo ${index + 1}`}
              </span>
              <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-medium text-primary">
                {grupo.totalItens} item{grupo.totalItens !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-zinc-400">
                {formatarPeso(grupo.pesoTotal)}
              </span>
              {(grupo.tempoEsperado ?? 0) > 0 && (
                <span className="rounded-full bg-amber-500/10 px-1.5 py-px text-[9px] font-medium text-amber-400">
                  {formatarTempoEsperado(grupo.tempoEsperado ?? 0).minutos} min
                </span>
              )}
            </div>
            {cab && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {cab.placa && (
                  <span className="rounded bg-zinc-800 px-1 py-px text-[9px] text-zinc-300">
                    {cab.placa}
                  </span>
                )}
                {cab.transportadora && (
                  <span className="rounded bg-zinc-800 px-1 py-px text-[9px] text-zinc-300">
                    {cab.transportadora}
                  </span>
                )}
                <span className="rounded bg-sky-500/10 px-1 py-px text-[9px] text-sky-400">
                  {cab.totalPaletes} pl · {cab.totalCaixas} cx · {cab.totalUnidades} un
                </span>
                <span className="truncate font-mono text-[9px] text-zinc-500">
                  {cab.microUuid}
                </span>
              </div>
            )}
            {grupo.subtitulo && (
              <p className="truncate text-[10px] text-zinc-500">{grupo.subtitulo}</p>
            )}
          </div>
        </button>
        {expandido && (
          <div className="flex shrink-0 gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[9px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => void copiar('cabecalho')}
            >
              {copiado === 'cabecalho' ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[9px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => void copiar('grupo')}
            >
              {copiado === 'grupo' ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
            </Button>
          </div>
        )}
      </div>

      {expandido && cab && (
        <div className="border-b border-zinc-800/80">
          <div className="flex items-center justify-between bg-zinc-900/40 px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Cabeçalho
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[9px] text-zinc-400 hover:text-zinc-200"
              onClick={() => void copiar('cabecalho')}
            >
              {copiado === 'cabecalho' ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
              Copiar cabeçalho
            </Button>
          </div>
          <pre className="max-h-48 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-amber-400/90">
            {cabecalhoJson}
          </pre>
        </div>
      )}

      {expandido && cab && variaveisResolvidas.length > 0 && (
        <div className="border-b border-zinc-800/80">
          <div className="flex items-center justify-between bg-zinc-900/40 px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Variáveis resolvidas (template)
            </span>
          </div>
          <div className="max-h-48 overflow-auto p-3">
            <table className="w-full border-collapse text-[10px]">
              <tbody className="divide-y divide-zinc-800/60">
                {variaveisResolvidas.map(({ chave, valor }) => (
                  <tr key={chave}>
                    <td className="py-1 pr-3 align-top font-mono text-sky-400/90">{chave}</td>
                    <td className="py-1 align-top text-zinc-300">{valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details className="mt-2">
              <summary className="cursor-pointer text-[9px] text-zinc-500">
                Ver JSON
              </summary>
              <pre className="mt-1 font-mono text-[10px] leading-relaxed text-violet-400/90">
                {variaveisResolvidasJson}
              </pre>
            </details>
          </div>
        </div>
      )}

      {expandido && (
        <div>
          <div className="flex items-center justify-between bg-zinc-900/40 px-3 py-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Itens
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[9px] text-zinc-400 hover:text-zinc-200"
              onClick={() => void copiar('itens')}
            >
              {copiado === 'itens' ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <Copy className="size-3" aria-hidden />
              )}
              Copiar itens
            </Button>
          </div>
          <pre className="max-h-64 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-emerald-400">
            {itensJson}
          </pre>
        </div>
      )}
    </div>
  );
}

export function GerarMapasPreviewPanel({
  blocos,
  gruposGerados,
  config,
  transportes,
  inicializado,
  temTransportes,
}: GerarMapasPreviewPanelProps) {
  const [etapaPreview, setEtapaPreview] = useState<PreviewEtapa>('separacao');
  const [copiado, setCopiado] = useState(false);

  const transportesPorId = useMemo(
    () => coletarTransportesMetaDeBlocos(blocos),
    [blocos],
  );

  const previewLocalSeparacao = useMemo<MapaEtapaPayload>(() => {
    const grupos = projetarBlocosParaJson(blocos, config, transportesPorId);

    return {
      agrupamento: labelAgrupamento(config),
      tipoDadosBasicos: config.tipoDadosBasicos,
      totalGrupos: grupos.length,
      grupos,
    };
  }, [blocos, config, transportesPorId]);

  const previewLocalConferencia = useMemo<MapaEtapaPayload>(() => {
    if (!transportes.length) {
      return {
        agrupamento: 'Replicar separação',
        tipoDadosBasicos: config.tipoDadosBasicos,
        totalGrupos: 0,
        grupos: [],
      };
    }

    return montarGruposMapaConferencia(
      transportes,
      config,
      blocos,
      previewLocalSeparacao,
    );
  }, [blocos, config, previewLocalSeparacao, transportes]);

  const previewSeparacaoAtivo = useMemo(() => {
    if (!gruposGerados) {
      return previewLocalSeparacao;
    }

    const separacao = gruposGerados.separacao ?? gruposGerados;
    const segregacaoAtiva =
      config.segregarPaleteFull || config.segregarUnidade;
    const backendComSegregacao = separacao.grupos.some(
      (grupo) =>
        grupo.titulo.includes('Paletes Completos') ||
        grupo.titulo.includes('Unidades'),
    );

    const backendComCabecalho = separacao.grupos.every(
      (grupo) =>
        grupo.cabecalho != null &&
        grupo.id === grupo.cabecalho.microUuid &&
        /^[A-Za-z0-9-]+-[A-Za-z0-9_-]{21}$/.test(grupo.cabecalho.microUuid),
    );

    if (segregacaoAtiva && !backendComSegregacao) {
      return previewLocalSeparacao;
    }

    if (!backendComCabecalho) {
      return previewLocalSeparacao;
    }

    return separacao;
  }, [
    config.segregarPaleteFull,
    config.segregarUnidade,
    gruposGerados,
    previewLocalSeparacao,
  ]);

  const previewConferenciaAtivo = useMemo(() => {
    if (!gruposGerados) {
      return previewLocalConferencia;
    }

    return gruposGerados.conferencia ?? previewLocalConferencia;
  }, [gruposGerados, previewLocalConferencia]);

  const previewAtivo =
    etapaPreview === 'separacao'
      ? previewSeparacaoAtivo
      : etapaPreview === 'conferencia'
        ? previewConferenciaAtivo
        : null;
  const totalGrupos =
    etapaPreview === 'carregamento'
      ? (gruposGerados?.carregamento?.totalMinutas ?? 0)
      : (previewAtivo?.totalGrupos ?? 0);
  const usandoBackend =
    gruposGerados != null &&
    (etapaPreview === 'carregamento'
      ? gruposGerados.carregamento != null
      : etapaPreview === 'separacao'
        ? previewSeparacaoAtivo === (gruposGerados.separacao ?? gruposGerados)
        : previewConferenciaAtivo === gruposGerados.conferencia);

  const jsonFormatado = useMemo(() => {
    if (etapaPreview === 'carregamento') {
      return JSON.stringify(gruposGerados?.carregamento ?? null, null, 2);
    }

    return JSON.stringify(previewAtivo, null, 2);
  }, [etapaPreview, gruposGerados?.carregamento, previewAtivo]);

  const copiarJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonFormatado);
      setCopiado(true);
      toast.success('JSON completo copiado para a área de transferência.');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o JSON.');
    }
  }, [jsonFormatado]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-low/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-outline-variant bg-surface-low p-0.5">
            <button
              type="button"
              className={cn(
                'rounded px-3 py-1 text-[11px] font-medium transition-colors',
                etapaPreview === 'separacao'
                  ? 'bg-primary text-on-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setEtapaPreview('separacao')}
            >
              Separação
            </button>
            <button
              type="button"
              className={cn(
                'rounded px-3 py-1 text-[11px] font-medium transition-colors',
                etapaPreview === 'conferencia'
                  ? 'bg-primary text-on-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setEtapaPreview('conferencia')}
            >
              Conferência
            </button>
            <button
              type="button"
              className={cn(
                'rounded px-3 py-1 text-[11px] font-medium transition-colors',
                etapaPreview === 'carregamento'
                  ? 'bg-primary text-on-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setEtapaPreview('carregamento')}
            >
              Carregamento
            </button>
          </div>
          {etapaPreview !== 'carregamento' && previewAtivo ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {previewAtivo.agrupamento}
            </span>
          ) : etapaPreview === 'carregamento' ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Minuta por transporte
            </span>
          ) : null}
          {etapaPreview === 'conferencia' && (
            <span className="rounded-full bg-surface-low px-2 py-0.5 text-[10px] text-muted-foreground">
              {CLASSIFICAR_POR_CONFERENCIA_LABELS[config.opcoesConferencia.classificarPor]}
              {' · '}
              {AGRUPAMENTO_CONFERENCIA_LABELS[config.opcoesConferencia.agrupamento]}
            </span>
          )}
          {gruposGerados && usandoBackend && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              Backend
            </span>
          )}
          {gruposGerados && !usandoBackend && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              Prévia local — clique em Gerar Mapas
            </span>
          )}
          {totalGrupos > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {etapaPreview === 'carregamento'
                ? `${totalGrupos} minuta${totalGrupos !== 1 ? 's' : ''}`
                : `${totalGrupos} grupo${totalGrupos !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        {etapaPreview === 'separacao' && totalGrupos > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={() => void copiarJson()}
          >
            {copiado ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <Copy className="size-3" aria-hidden />
            )}
            Copiar tudo
          </Button>
        )}
      </div>

      <div
        className={cn(
          etapaPreview === 'separacao' && 'bg-zinc-950/95 p-4',
          etapaPreview === 'conferencia' && 'bg-surface-low/20',
        )}
      >
        {!inicializado ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Carregando pré-visualização...
          </p>
        ) : !temTransportes ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Selecione transportes para visualizar os grupos.
          </p>
        ) : etapaPreview === 'carregamento' ? (
          gruposGerados?.carregamento ? (
            <CarregamentoPreviewPanel carregamento={gruposGerados.carregamento} />
          ) : (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              Clique em Gerar Mapas para visualizar as minutas de carregamento.
            </p>
          )
        ) : totalGrupos === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Nenhum grupo gerado com a configuração atual.
          </p>
        ) : etapaPreview === 'conferencia' ? (
          <ConferenciaPreviewTable grupos={previewConferenciaAtivo.grupos} />
        ) : (
          <div className="max-h-[480px] space-y-2 overflow-auto pr-1">
            {previewSeparacaoAtivo.grupos.map((grupo, index) => (
              <GrupoPreviewRow key={grupo.id} grupo={grupo} index={index} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
