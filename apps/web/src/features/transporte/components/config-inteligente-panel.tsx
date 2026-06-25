'use client';

import { Button, cn } from '@lilog/ui';
import {
  Brain,
  Clock3,
  FileText,
  Gauge,
  Layers,
  Minus,
  Plus,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import {
  META_VELOCIDADE_DESCRICOES,
  META_VELOCIDADE_LABELS,
  MODO_INTELIGENCIA_LABELS,
  TIPO_SEPARACAO_LABELS,
  type MetaVelocidade,
  type ModoInteligencia,
  type SugestaoInteligente,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';

type ConfigInteligentePanelProps = {
  desabilitado: boolean;
  modoInteligencia: ModoInteligencia;
  qtdSeparadores: number;
  metaVelocidade: MetaVelocidade;
  sugestao: SugestaoInteligente | null;
  onSelecionarModo: (modo: ModoInteligencia) => void;
  onAlterarQtdSeparadores: (qtd: number) => void;
  onSelecionarMetaVelocidade: (meta: MetaVelocidade) => void;
  onGerarSugestao: () => void;
  onAplicarSugestao: () => void;
};

const METAS_VELOCIDADE: MetaVelocidade[] = [
  'urgente',
  'rapido',
  'balanceado',
  'cuidadoso',
];

const ATALHOS_INTELIGENTES: Array<{
  modo: ModoInteligencia;
  label: string;
  descricao: string;
  icon: typeof Brain;
}> = [
  {
    modo: 'auto_tipo',
    label: 'Detectar melhor tipo',
    descricao: 'Analisa pedidos, zonas e SKUs do transporte',
    icon: Brain,
  },
  {
    modo: 'balancear_carga',
    label: 'Balancear carga',
    descricao: 'Distribui itens de forma uniforme entre operadores',
    icon: Layers,
  },
  {
    modo: 'minimizar_tempo',
    label: 'Minimizar tempo',
    descricao: 'Testa combinações e escolhe a mais rápida',
    icon: Zap,
  },
  {
    modo: 'minimizar_papel',
    label: 'Minimizar papel',
    descricao: 'Reduz folhas e otimiza formato de impressão',
    icon: FileText,
  },
];

const CONFIANCA_STYLES = {
  alta: 'bg-tertiary/15 text-tertiary',
  media: 'bg-secondary/15 text-secondary',
  baixa: 'bg-muted text-muted-foreground',
} as const;

export function ConfigInteligentePanel({
  desabilitado,
  modoInteligencia,
  qtdSeparadores,
  metaVelocidade,
  sugestao,
  onSelecionarModo,
  onAlterarQtdSeparadores,
  onSelecionarMetaVelocidade,
  onGerarSugestao,
  onAplicarSugestao,
}: ConfigInteligentePanelProps) {
  const assistido = modoInteligencia !== 'manual';

  return (
    <section className="space-y-4 rounded-xl border border-outline-variant bg-glass-bg p-5 shadow-inner-glow backdrop-blur-glass">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden />
            Assistente Inteligente
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Defina quantidade de separadores, meta de velocidade ou use atalhos
            para configurar automaticamente tipo, operadores e impressão.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-outline-variant bg-surface-low p-0.5">
          <button
            type="button"
            disabled={desabilitado}
            onClick={() => onSelecionarModo('manual')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              !assistido
                ? 'bg-primary text-on-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Manual
          </button>
          <button
            type="button"
            disabled={desabilitado}
            onClick={() => onSelecionarModo('qtd_separadores')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              assistido
                ? 'bg-primary text-on-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Assistido
          </button>
        </div>
      </div>

      {desabilitado ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-low/40 px-4 py-6 text-center text-xs text-muted-foreground">
          Carregue um transporte para habilitar o assistente inteligente.
        </p>
      ) : (
        <>
          {assistido && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-low/40 p-4">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" aria-hidden />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quantidade de separadores
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe quantos operadores estarão disponíveis. O sistema
                  define tipo, distribuição e mapas automaticamente.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={() => onAlterarQtdSeparadores(qtdSeparadores - 1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={qtdSeparadores}
                    onChange={(event) =>
                      onAlterarQtdSeparadores(Number(event.target.value))
                    }
                    className="w-16 rounded-lg border border-outline-variant bg-surface-low px-2 py-2 text-center text-sm font-mono font-bold"
                    aria-label="Quantidade de separadores"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={() => onAlterarQtdSeparadores(qtdSeparadores + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      onSelecionarModo('qtd_separadores');
                      onGerarSugestao();
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-low/40 p-4">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-primary" aria-hidden />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Meta de velocidade
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha o ritmo desejado. O assistente calcula operadores,
                  tipo de separação e densidade dos mapas.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {METAS_VELOCIDADE.map((meta) => (
                    <button
                      key={meta}
                      type="button"
                      onClick={() => onSelecionarMetaVelocidade(meta)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left transition-colors',
                        metaVelocidade === meta
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-outline-variant bg-surface-low hover:border-primary/20',
                      )}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {META_VELOCIDADE_LABELS[meta]}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {META_VELOCIDADE_DESCRICOES[meta]}
                      </span>
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 w-full text-xs"
                  onClick={() => {
                    onSelecionarModo('meta_velocidade');
                    onGerarSugestao();
                  }}
                >
                  <Clock3 className="size-3.5" aria-hidden />
                  Calcular pela meta de velocidade
                </Button>
              </div>
            </div>
          )}

          {assistido && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ATALHOS_INTELIGENTES.map((atalho) => {
                const Icon = atalho.icon;
                const ativo = modoInteligencia === atalho.modo;

                return (
                  <button
                    key={atalho.modo}
                    type="button"
                    onClick={() => {
                      onSelecionarModo(atalho.modo);
                      onGerarSugestao();
                    }}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      ativo
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-outline-variant bg-surface-low/40 hover:border-primary/20',
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-high text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-foreground">
                        {atalho.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {atalho.descricao}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {assistido && sugestao && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Sugestão: {MODO_INTELIGENCIA_LABELS[sugestao.modo]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {TIPO_SEPARACAO_LABELS[sugestao.config.tipoSeparacao]} ·{' '}
                    {sugestao.config.operadores.length} operador(es)
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                    CONFIANCA_STYLES[sugestao.confianca],
                  )}
                >
                  Confiança {sugestao.confianca}
                </span>
              </div>

              <ul className="space-y-1">
                {sugestao.explicacoes.map((texto) => (
                  <li
                    key={texto}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    {texto}
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={onAplicarSugestao}
              >
                <Sparkles className="size-3.5" aria-hidden />
                Aplicar sugestão à configuração
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
