'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Printer, X } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { MapaImpressaoBloco } from '@/features/transporte/components/mapa-impressao-bloco';
import { montarBlocosMapa } from '@/features/transporte/lib/montar-blocos-mapa';
import {
  loadMapaImpressaoPayload,
  loadMapaTransportes,
} from '@/features/transporte/storage/mapa-impressao-storage';
import type { ImpressaoPayload } from '@/features/transporte/types/transporte.schema';
import { AGRUPAMENTO_MAPA_LABELS } from '@/features/transporte/types/transporte.schema';

function formatarResumoAgrupamento(
  payload: ImpressaoPayload,
): string {
  const labels = payload.config.agrupamento.tiposAtivos.map(
    (tipo) => AGRUPAMENTO_MAPA_LABELS[tipo],
  );

  return labels.length ? labels.join(', ') : 'Padrão';
}

function formatarDataHora(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
}

export function ImprimirMapasView() {
  const router = useRouter();
  const [payload, setPayload] = useState<ImpressaoPayload | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setPayload(loadMapaImpressaoPayload());
    setCarregado(true);
  }, []);

  const blocos = useMemo(() => {
    if (!payload) {
      return [];
    }

    const transportes = loadMapaTransportes().filter((transporte) =>
      payload.ids.includes(transporte.id),
    );

    return montarBlocosMapa(transportes, payload.config);
  }, [payload]);

  const transportesSemMapaSalvo = useMemo(() => {
    if (!payload) {
      return [];
    }

    return loadMapaTransportes().filter(
      (transporte) =>
        payload.ids.includes(transporte.id) && transporte.ultimoMapaLoteId == null,
    );
  }, [payload]);

  const podeImprimir = transportesSemMapaSalvo.length === 0 && blocos.length > 0;

  const imprimir = () => {
    window.print();
  };

  const fechar = () => {
    window.close();
    router.push('/transporte/gerar-mapas');
  };

  if (!carregado) {
    return null;
  }

  if (!payload || !blocos.length) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">
            Nenhum mapa para impressão
          </h1>
          <p className="text-sm text-zinc-600">
            Volte à página de configuração, selecione transportes e gere os
            mapas novamente.
          </p>
          <Button type="button" onClick={() => router.push('/transporte/gerar-mapas')}>
            Ir para configuração
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white text-zinc-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 print:hidden">
        <div>
          <h1 className="text-sm font-semibold">Mapas para impressão</h1>
          <p className="text-xs text-zinc-500">
            {blocos.length} bloco{blocos.length !== 1 ? 's' : ''} ·{' '}
            {formatarResumoAgrupamento(payload)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={fechar}
          >
            <X className="size-3.5" aria-hidden />
            Fechar
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={!podeImprimir}
            title={
              !podeImprimir
                ? 'Salve os mapas antes de imprimir'
                : undefined
            }
            onClick={imprimir}
          >
            <Printer className="size-3.5" aria-hidden />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 p-6 print:space-y-6 print:p-4">
        <section className="rounded-lg border border-zinc-200 p-4 print:hidden">
          <p className="text-xs text-zinc-600">
            Gerado em {formatarDataHora()} · {payload.ids.length} transporte
            {payload.ids.length !== 1 ? 's' : ''}
          </p>
          {!podeImprimir && transportesSemMapaSalvo.length > 0 && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Salve os mapas antes de imprimir ({transportesSemMapaSalvo.length}{' '}
              transporte{transportesSemMapaSalvo.length !== 1 ? 's' : ''} sem mapa
              salvo).
            </p>
          )}
        </section>

        {blocos.map((bloco, index) => (
          <MapaImpressaoBloco
            key={bloco.id}
            bloco={bloco}
            config={payload.config}
            className={cn(index > 0 && 'print:break-before-page')}
            pageBreakBefore={index > 0}
          />
        ))}
      </div>
    </div>
  );
}
