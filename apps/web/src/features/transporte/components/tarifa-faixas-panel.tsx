'use client';

import { Button, cn } from '@lilog/ui';
import {
  ArrowRight,
  Check,
  DollarSign,
  Info,
  MapPin,
  Pencil,
  Plus,
  Route,
  Trash2,
  X,
} from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type { FaixaKmItem } from '@/features/transporte/types/perfil-tarifa.schema';
import { formatKmRange } from '@/features/transporte/types/perfil-tarifa.schema';

const inputClass = cn(
  'w-full rounded-lg border border-outline-variant bg-surface-low px-2.5 py-1.5',
  'font-mono text-sm text-foreground placeholder:text-muted-foreground/60',
  'transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
);

const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground';
const hintClass = 'text-[10px] leading-snug text-muted-foreground/80';

export type TarifaFaixasPanelProps = {
  faixas: FaixaKmItem[];
  editando: boolean;
  proporcaoMax: number;
  salvaComSucesso?: boolean;
  onIniciarEdicao: () => void;
  onSalvar: () => void;
  onCancelar: () => void;
  onAdicionarFaixa: () => void;
  onRemoverFaixa: (index: number) => void;
  onAtualizarFaixa: (
    index: number,
    campo: keyof FaixaKmItem,
    valor: number | string | null,
  ) => void;
  isSubmitting: boolean;
  variant?: 'standalone' | 'embedded';
};

function FaixaEditGuide() {
  return (
    <div
      className={cn(
        'rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5',
      )}
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">
            Como configurar as faixas
          </p>
          <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            <li>
              Cada faixa define o <strong className="text-foreground">valor do frete</strong>{' '}
              para um intervalo de distância em km.
            </li>
            <li>
              <strong className="text-foreground">Km final em branco</strong> significa
              &quot;acima do km inicial&quot; (faixa aberta).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function FaixaEditRow({
  faixa,
  index,
  total,
  onAtualizarFaixa,
  onRemoverFaixa,
}: {
  faixa: FaixaKmItem;
  index: number;
  total: number;
  onAtualizarFaixa: TarifaFaixasPanelProps['onAtualizarFaixa'];
  onRemoverFaixa: TarifaFaixasPanelProps['onRemoverFaixa'];
}) {
  const previewRange = formatKmRange(faixa.kmInicial, faixa.kmFinal);
  const previewValor =
    faixa.valor > 0 ? formatarMoeda(faixa.valor) : 'Informe o valor';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-outline-variant/60',
        'bg-surface-low/80 ring-1 ring-inset ring-outline-variant/20',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 bg-surface-highest/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full',
              'bg-primary/10 text-[10px] font-bold text-primary',
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              Faixa {index + 1} de {total}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {previewRange} · {previewValor}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive hover:bg-destructive/10"
          onClick={() => onRemoverFaixa(index)}
          disabled={total <= 1}
          aria-label={`Remover faixa ${index + 1}`}
          title={total <= 1 ? 'É necessário manter ao menos uma faixa' : 'Remover faixa'}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className={cn(labelClass, 'flex items-center gap-1')}>
            <MapPin className="size-2.5" aria-hidden />
            Km inicial
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={faixa.kmInicial}
            onChange={(event) =>
              onAtualizarFaixa(
                index,
                'kmInicial',
                Number.parseFloat(event.target.value) || 0,
              )
            }
            className={inputClass}
            placeholder="0"
            aria-label={`Km inicial da faixa ${index + 1}`}
          />
          <p className={hintClass}>Distância mínima da faixa</p>
        </div>

        <div className="space-y-1">
          <label className={cn(labelClass, 'flex items-center gap-1')}>
            <Route className="size-2.5" aria-hidden />
            Km final
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={faixa.kmFinal ?? ''}
            placeholder="Aberto"
            onChange={(event) =>
              onAtualizarFaixa(
                index,
                'kmFinal',
                event.target.value === ''
                  ? null
                  : Number.parseFloat(event.target.value) || 0,
              )
            }
            className={inputClass}
            aria-label={`Km final da faixa ${index + 1}`}
          />
          <p className={hintClass}>Vazio = acima do km inicial</p>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Valor (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={faixa.valor}
            onChange={(event) =>
              onAtualizarFaixa(
                index,
                'valor',
                Number.parseFloat(event.target.value) || 0,
              )
            }
            className={inputClass}
            placeholder="0,00"
            aria-label={`Valor da faixa ${index + 1}`}
          />
          <p className={hintClass}>Tarifa cobrada neste intervalo</p>
        </div>

        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
          <label className={cn(labelClass, 'flex items-center gap-1')}>
            <Route className="size-2.5" aria-hidden />
            Itinerário
          </label>
          <input
            type="text"
            value={faixa.itinerario ?? ''}
            onChange={(event) =>
              onAtualizarFaixa(
                index,
                'itinerario',
                event.target.value === '' ? null : event.target.value,
              )
            }
            className={inputClass}
            placeholder="Ex: São Paulo → Campinas"
            aria-label={`Itinerário da faixa ${index + 1}`}
          />
          <p className={hintClass}>Descrição opcional da rota ou itinerário</p>
        </div>
      </div>
    </div>
  );
}

export function TarifaFaixasPanel({
  faixas,
  editando,
  proporcaoMax,
  salvaComSucesso = false,
  onIniciarEdicao,
  onSalvar,
  onCancelar,
  onAdicionarFaixa,
  onRemoverFaixa,
  onAtualizarFaixa,
  isSubmitting,
  variant = 'standalone',
}: TarifaFaixasPanelProps) {
  const embedded = variant === 'embedded';
  const maiorValor =
    faixas.length > 0 ? Math.max(...faixas.map((faixa) => faixa.valor)) : 0;
  const proporcao =
    proporcaoMax > 0 ? Math.round((maiorValor / proporcaoMax) * 100) : 0;

  return (
    <div
      className={cn(
        'space-y-3',
        embedded && 'rounded-xl border border-outline-variant/50 bg-surface-low/40 p-3',
        salvaComSucesso && embedded && 'border-tertiary/40 bg-tertiary/5',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="size-3.5 text-primary" aria-hidden />
          <p className="text-xs font-semibold text-foreground">Tarifas por km</p>
        </div>

        {editando ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-tertiary"
              onClick={onSalvar}
              disabled={isSubmitting}
              aria-label="Salvar tarifas"
            >
              <Check className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={onCancelar}
              disabled={isSubmitting}
              aria-label="Cancelar edição de tarifas"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={onIniciarEdicao}
          >
            <Pencil className="size-3" aria-hidden />
            {faixas.length > 0 ? 'Editar tarifas' : 'Adicionar tarifa'}
          </Button>
        )}
      </div>

      {editando ? <FaixaEditGuide /> : null}

      {faixas.length === 0 ? (
        <div
          className={cn(
            'rounded-lg border border-dashed border-outline-variant/60',
            'bg-surface-low/40 px-3 py-4 text-center',
          )}
        >
          <Route className="mx-auto size-6 text-muted-foreground/40" aria-hidden />
          <p className="mt-2 text-xs font-medium text-foreground">
            Nenhuma faixa configurada
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {editando
              ? 'Preencha a faixa abaixo ou adicione novas faixas.'
              : 'Configure valores por distância em km.'}
          </p>
        </div>
      ) : editando ? (
        <div className="space-y-2">
          {faixas.map((faixa, index) => (
            <FaixaEditRow
              key={faixa.id ?? `faixa-${index}`}
              faixa={faixa}
              index={index}
              total={faixas.length}
              onAtualizarFaixa={onAtualizarFaixa}
              onRemoverFaixa={onRemoverFaixa}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {faixas.map((faixa, index) => (
            <div
              key={faixa.id ?? `faixa-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface-low/70 px-2.5 py-2 ring-1 ring-inset ring-outline-variant/30"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {formatKmRange(faixa.kmInicial, faixa.kmFinal)}
                </p>
                {faixa.itinerario ? (
                  <p className="truncate text-[10px] text-muted-foreground">
                    {faixa.itinerario}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-mono text-xs font-bold text-foreground">
                {formatarMoeda(faixa.valor)}
              </p>
            </div>
          ))}
        </div>
      )}

      {editando ? (
        <button
          type="button"
          onClick={onAdicionarFaixa}
          className={cn(
            'group flex w-full items-center gap-2 rounded-lg border border-dashed',
            'border-primary/30 bg-primary/5 px-3 py-2.5 text-left transition-all',
            'hover:border-primary/50 hover:bg-primary/10',
          )}
        >
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              'bg-primary/10 text-primary transition-colors',
              'group-hover:bg-primary group-hover:text-primary-foreground',
            )}
          >
            <Plus className="size-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-foreground">
              Adicionar faixa
            </span>
            {!embedded ? (
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                Nova faixa a partir do km final anterior + 1
              </span>
            ) : null}
          </span>
          <ArrowRight
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </button>
      ) : null}

      {!editando && faixas.length > 0 && !embedded ? (
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>Maior valor</span>
          <span className="font-mono font-semibold text-foreground">
            {formatarMoeda(maiorValor)} · {proporcao}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
