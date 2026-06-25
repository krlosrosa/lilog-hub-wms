'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { listarConfiguracoesImpressao } from '@/features/expedicao-impressao-config/lib/configuracao-impressao-api';
import type { ConfiguracaoImpressaoApi } from '@/features/expedicao-impressao-config/types/configuracao-impressao.api';
import type { TipoMapaImpressao } from '@/features/transporte/lib/imprimir-mapas-api';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';
import { TIPO_LAYOUT_MAPA_LABELS } from '@/features/expedicao-impressao-config/types/layout-mapa';

const fieldClassName = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type ImprimirMapasModalProps = {
  aberto: boolean;
  unidadeId: string | null;
  transportesSelecionados: TransporteGrupo[];
  gerando: boolean;
  onConfirmar: (configuracaoImpressaoId: string, tipoMapa: TipoMapaImpressao) => void;
  onCancelar: () => void;
};

export function ImprimirMapasModal({
  aberto,
  unidadeId,
  transportesSelecionados,
  gerando,
  onConfirmar,
  onCancelar,
}: ImprimirMapasModalProps) {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoImpressaoApi[]>(
    [],
  );
  const [carregandoConfigs, setCarregandoConfigs] = useState(false);
  const [configuracaoId, setConfiguracaoId] = useState<string>('');
  const [tipoMapa, setTipoMapa] = useState<TipoMapaImpressao>('separacao');

  useEffect(() => {
    if (!aberto || !unidadeId) {
      return;
    }

    let ativo = true;
    setCarregandoConfigs(true);

    void listarConfiguracoesImpressao(unidadeId)
      .then((response) => {
        if (!ativo) {
          return;
        }

        setConfiguracoes(response.items);
        const padrao = response.items.find((item) => item.isPadrao);
        setConfiguracaoId(padrao?.id ?? response.items[0]?.id ?? '');
      })
      .finally(() => {
        if (ativo) {
          setCarregandoConfigs(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [aberto, unidadeId]);

  const transportesSemMapa = useMemo(
    () =>
      transportesSelecionados.filter(
        (transporte) => transporte.ultimoMapaLoteId == null,
      ),
    [transportesSelecionados],
  );

  const textoAjudaTipoMapa = useMemo(() => {
    if (tipoMapa === 'conferencia') {
      return 'Usa o HTML de conferência e a ordem de colunas definida na configuração.';
    }

    if (tipoMapa === 'carregamento') {
      return 'Usa o HTML de carregamento e as tabelas de empresa/clientes da configuração.';
    }

    if (tipoMapa === 'todos') {
      return 'Gera um único PDF com mapas de separação, conferência e carregamento, nesta ordem.';
    }

    return 'Usa o HTML de separação e a ordem de colunas definida na configuração.';
  }, [tipoMapa]);

  const podeGerar =
    configuracaoId.length > 0 &&
    transportesSelecionados.length > 0 &&
    transportesSemMapa.length === 0 &&
    !carregandoConfigs &&
    !gerando;

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onCancelar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Imprimir mapas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-outline-variant bg-surface-low/40 p-3 text-xs">
            <p>
              <span className="text-muted-foreground">Transportes selecionados:</span>{' '}
              <span className="font-semibold tabular-nums">
                {transportesSelecionados.length}
              </span>
            </p>
          </div>

          <div>
            <label
              htmlFor="tipo-mapa-impressao"
              className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Tipo de mapa
            </label>
            <select
              id="tipo-mapa-impressao"
              value={tipoMapa}
              onChange={(event) =>
                setTipoMapa(event.target.value as TipoMapaImpressao)
              }
              className={fieldClassName}
            >
              <option value="separacao">{TIPO_LAYOUT_MAPA_LABELS.separacao}</option>
              <option value="conferencia">{TIPO_LAYOUT_MAPA_LABELS.conferencia}</option>
              <option value="carregamento">Minuta de carregamento</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="config-impressao"
              className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Configuração de impressão
            </label>
            <select
              id="config-impressao"
              value={configuracaoId}
              disabled={carregandoConfigs || configuracoes.length === 0}
              onChange={(event) => setConfiguracaoId(event.target.value)}
              className={fieldClassName}
            >
              {configuracoes.length === 0 ? (
                <option value="">Nenhuma configuração disponível</option>
              ) : (
                configuracoes.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.nome}
                    {config.isPadrao ? ' (padrão)' : ''}
                  </option>
                ))
              )}
            </select>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {textoAjudaTipoMapa}
            </p>
          </div>

          {transportesSemMapa.length > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">
                  Salve os mapas antes de imprimir.
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {transportesSemMapa.map((transporte) => (
                    <li key={transporte.id}>{transporte.rota}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar} disabled={gerando}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!podeGerar}
            onClick={() => onConfirmar(configuracaoId, tipoMapa)}
          >
            {gerando ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Gerando PDF...
              </>
            ) : (
              'Gerar PDF'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
