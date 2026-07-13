'use client';

import { Fragment, useMemo, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import {
  ChevronDown,
  ChevronRight,
  History,
  ImageIcon,
  Lightbulb,
  Pencil,
  Trash2,
} from 'lucide-react';

import { conferenciaTableCellClassName } from '@/components/ui/compact-table-classes';
import { ModalEditarItemCnc } from '@/features/cnc/components/modal-editar-item-cnc';
import { useCncItemActions } from '@/features/cnc/hooks/use-cnc-item-actions';
import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';
import type { CncEvento, CncItem } from '@/features/cnc/types/cnc.schema';
import {
  CNC_EVENTO_LABELS,
  CNC_ITEM_TIPO_LABELS,
  CNC_RESPONSAVEL_LABELS,
  CNC_SUBTIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';
import {
  filtrarEventosDoItem,
  formatCncDate,
  formatCncPesoKg,
  formatarDetalhesEventoItem,
  getAnaliseSugerida,
  isPesoDivergenteItem,
  SUBTIPO_CONFIG,
} from '@/features/cnc/lib/cnc-detalhe-utils';
import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import { getCncItemAvariaLabels } from '@/features/recebimento/lib/avaria-labels';
import type { FotoEvidencia } from '@/features/recebimento/types/recebimento-detalhe.schema';

type CncAnomaliaRowProps = {
  item: CncItem;
  index: number;
  colSpan: number;
  defaultExpanded?: boolean;
  fotos?: FotoEvidencia[];
  podeGerenciar?: boolean;
  cncId?: string;
  eventos?: CncEvento[];
  onSalvo?: () => void | Promise<void>;
};

function MetaPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'primary';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]',
        tone === 'danger' &&
          'border-destructive/25 bg-destructive/5 text-destructive',
        tone === 'primary' &&
          'border-primary/25 bg-primary/5 text-primary',
        tone === 'default' &&
          'border-outline-variant/50 bg-background/70 text-foreground',
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

function formatValorEsperado(
  item: CncItem,
  formatQtdValue: (value: number | null, unidade?: string | null) => string,
) {
  if (isPesoDivergenteItem(item)) {
    return formatCncPesoKg(item.pesoEsperado);
  }

  return formatQtdValue(item.quantidadeEsperada, item.unidadeMedida);
}

function formatValorRecebido(
  item: CncItem,
  formatQtdValue: (value: number | null, unidade?: string | null) => string,
) {
  if (isPesoDivergenteItem(item)) {
    return formatCncPesoKg(item.pesoRecebido);
  }

  return formatQtdValue(item.quantidadeRecebida, item.unidadeMedida);
}

function formatValorDivergencia(
  item: CncItem,
  formatQtdValue: (value: number | null, unidade?: string | null) => string,
) {
  if (isPesoDivergenteItem(item)) {
    const esperado = item.pesoEsperado ?? 0;
    const recebido = item.pesoRecebido ?? 0;
    const divergencia =
      item.quantidadeDivergente ?? Math.abs(esperado - recebido);

    return formatCncPesoKg(divergencia);
  }

  return formatQtdValue(item.quantidadeDivergente, item.unidadeMedida);
}

function hasDivergenciaValor(item: CncItem): boolean {
  if (isPesoDivergenteItem(item)) {
    const esperado = item.pesoEsperado;
    const recebido = item.pesoRecebido;

    if (esperado === null || recebido === null) {
      return item.quantidadeDivergente !== null && item.quantidadeDivergente !== 0;
    }

    return esperado !== recebido;
  }

  return item.quantidadeDivergente !== null && item.quantidadeDivergente !== 0;
}

export function CncAnomaliaRow({
  item,
  index,
  colSpan,
  defaultExpanded = false,
  fotos = [],
  podeGerenciar = false,
  cncId,
  eventos = [],
  onSalvo,
}: CncAnomaliaRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalRemover, setModalRemover] = useState(false);
  const { formatQtdValue } = useDisplayConfig();
  const { atualizar, remover, processando } = useCncItemActions(
    cncId ?? '',
    onSalvo,
  );

  const subtipoConfig = item.subtipoOcorrencia
    ? SUBTIPO_CONFIG[item.subtipoOcorrencia]
    : null;
  const analiseSugerida = getAnaliseSugerida(item);
  const avariaLabels = getCncItemAvariaLabels(item);
  const hasDivergencia = hasDivergenciaValor(item);
  const historicoItem = useMemo(
    () => filtrarEventosDoItem(eventos, item.id),
    [eventos, item.id],
  );

  const loteDivergente =
    item.loteEsperado &&
    item.loteRecebido &&
    item.loteEsperado !== item.loteRecebido;

  const hasExtraDetails =
    Boolean(
      item.loteEsperado ||
        item.loteRecebido ||
        item.validadeEsperada ||
        item.validadeRecebida ||
        item.pesoEsperado ||
        item.pesoRecebido ||
        item.descricaoDetalhe ||
        item.naturezaAvaria ||
        item.causaAvaria ||
        item.tipoAvaria ||
        analiseSugerida ||
        fotos.length > 0 ||
        historicoItem.length > 0,
    );

  const rowBg =
    item.tipo === 'avaria'
      ? 'bg-destructive/[0.03]'
      : hasDivergencia
        ? 'bg-destructive/[0.02]'
        : undefined;

  const handleRemover = async () => {
    if (!cncId) {
      return;
    }

    await remover(item.id);
    setModalRemover(false);
  };

  const toggleExpanded = () => {
    if (!hasExtraDetails) {
      return;
    }

    setExpanded((value) => !value);
  };

  return (
    <Fragment>
      <tr
        className={cn(
          'group transition-colors hover:bg-muted/30',
          expanded && 'bg-muted/20',
          rowBg,
          hasExtraDetails && 'cursor-pointer',
        )}
        onClick={hasExtraDetails ? toggleExpanded : undefined}
      >
        <td className={cn(conferenciaTableCellClassName, 'w-7 pl-2')}>
          {hasExtraDetails ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded();
              }}
              className={cn(
                'flex items-center rounded p-0.5 transition-colors hover:bg-muted/50',
                item.tipo === 'avaria' ? 'text-destructive' : 'text-muted-foreground',
              )}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? `Recolher detalhes da anomalia ${index + 1}`
                  : `Expandir detalhes da anomalia ${index + 1}`
              }
            >
              {expanded ? (
                <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              )}
            </button>
          ) : null}
        </td>

        <td className={cn(conferenciaTableCellClassName, 'text-center')}>
          <span
            className={cn(
              'inline-flex size-5 items-center justify-center rounded text-[10px] font-bold tabular-nums',
              subtipoConfig
                ? cn(subtipoConfig.bg, subtipoConfig.accent)
                : item.tipo === 'avaria'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary/10 text-secondary',
            )}
          >
            {index + 1}
          </span>
        </td>

        <td
          className={cn(conferenciaTableCellClassName, 'max-w-[220px]')}
          title={item.descricaoProduto ?? undefined}
        >
          <p className="truncate font-mono text-[10px] text-primary">
            {item.sku ?? item.produtoId ?? '—'}
          </p>
          <p className="truncate text-[11px] font-medium text-foreground">
            {item.descricaoProduto ?? 'Sem descrição'}
          </p>
        </td>

        <td className={cn(conferenciaTableCellClassName, 'hidden sm:table-cell')}>
          <span
            className={cn(
              'inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
              item.tipo === 'avaria'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-secondary/10 text-secondary',
            )}
          >
            {CNC_ITEM_TIPO_LABELS[item.tipo]}
          </span>
          {item.subtipoOcorrencia ? (
            <p
              className={cn(
                'mt-0.5 truncate text-[10px] font-medium',
                subtipoConfig?.accent ?? 'text-muted-foreground',
              )}
            >
              {CNC_SUBTIPO_LABELS[item.subtipoOcorrencia]}
            </p>
          ) : null}
        </td>

        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-right tabular-nums text-muted-foreground',
          )}
        >
          {formatValorEsperado(item, formatQtdValue)}
        </td>

        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-right tabular-nums font-medium text-foreground',
          )}
        >
          {formatValorRecebido(item, formatQtdValue)}
        </td>

        <td
          className={cn(
            conferenciaTableCellClassName,
            'text-right tabular-nums font-semibold',
            hasDivergencia ? 'text-destructive' : 'text-status-active',
          )}
        >
          {formatValorDivergencia(item, formatQtdValue)}
        </td>

        <td
          className={cn(
            conferenciaTableCellClassName,
            'hidden truncate text-[11px] md:table-cell',
          )}
          title={
            item.responsavelSugerido
              ? CNC_RESPONSAVEL_LABELS[item.responsavelSugerido]
              : undefined
          }
        >
          {item.responsavelSugerido
            ? CNC_RESPONSAVEL_LABELS[item.responsavelSugerido]
            : '—'}
        </td>

        <td className={cn(conferenciaTableCellClassName, 'text-center')}>
          {fotos.length > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded border border-destructive/25 bg-destructive/5 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              <ImageIcon className="size-2.5" aria-hidden />
              {fotos.length}
            </span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </td>

        {podeGerenciar ? (
          <td
            className={cn(conferenciaTableCellClassName, 'text-center')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inline-flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                aria-label={`Editar item ${index + 1}`}
                disabled={processando}
                onClick={() => setModalEditar(true)}
              >
                <Pencil className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
                aria-label={`Remover item ${index + 1}`}
                disabled={processando}
                onClick={() => setModalRemover(true)}
              >
                <Trash2 className="size-3" aria-hidden />
              </Button>
            </div>
          </td>
        ) : null}
      </tr>

      {expanded && hasExtraDetails ? (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <div className="border-y border-outline-variant/30 bg-gradient-to-r from-muted/25 via-muted/10 to-transparent px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(item.loteEsperado || item.loteRecebido) && (
                  <>
                    <MetaPill label="Lote esp." value={item.loteEsperado ?? '—'} />
                    <MetaPill
                      label="Lote rec."
                      value={item.loteRecebido ?? '—'}
                      tone={loteDivergente ? 'danger' : 'default'}
                    />
                  </>
                )}

                {isPesoDivergenteItem(item) &&
                (item.pesoEsperado || item.pesoRecebido) ? (
                  <>
                    <MetaPill
                      label="Peso esp."
                      value={formatCncPesoKg(item.pesoEsperado)}
                    />
                    <MetaPill
                      label="Peso rec."
                      value={formatCncPesoKg(item.pesoRecebido)}
                    />
                  </>
                ) : null}

                {item.tipo === 'divergencia' && item.descricaoDetalhe ? (
                  <MetaPill label="Detalhe" value={item.descricaoDetalhe} />
                ) : null}

                {avariaLabels.natureza ? (
                  <MetaPill label="Natureza" value={avariaLabels.natureza} />
                ) : null}
                {avariaLabels.causa ? (
                  <MetaPill label="Causa" value={avariaLabels.causa} />
                ) : null}
                {avariaLabels.tipo ? (
                  <MetaPill label="Tipo avaria" value={avariaLabels.tipo} />
                ) : null}

                {item.tipo === 'avaria' &&
                (item.quantidadeCaixas || item.quantidadeUnidades) ? (
                  <MetaPill
                    label="Composição"
                    value={[
                      item.quantidadeCaixas
                        ? `${item.quantidadeCaixas} cx`
                        : null,
                      item.quantidadeUnidades
                        ? `${item.quantidadeUnidades} un`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                ) : null}
              </div>

              {fotos.length > 0 ? (
                <div className="mt-2.5">
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <ImageIcon className="size-2.5" aria-hidden />
                    Fotos ({fotos.length})
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {fotos.map((foto) => (
                      <FotoExpandivel
                        key={foto.id}
                        id={foto.id}
                        url={foto.url}
                        legenda={foto.legenda}
                        className="group relative size-14 shrink-0 overflow-hidden rounded-md border border-outline-variant/60 bg-muted/25 transition-colors hover:border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {historicoItem.length > 0 ? (
                <details className="mt-2.5 rounded-md border border-outline-variant/40 bg-background/50">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                    <History className="size-2.5" aria-hidden />
                    Histórico ({historicoItem.length})
                  </summary>
                  <div className="space-y-1.5 border-t border-outline-variant/30 px-2.5 py-2">
                    {[...historicoItem]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((evento) => {
                        const detalhes = formatarDetalhesEventoItem(evento, {
                          subtipoOcorrencia: item.subtipoOcorrencia,
                          unidadeMedida: item.unidadeMedida,
                        });

                        return (
                          <div
                            key={evento.id}
                            className="rounded border border-outline-variant/30 bg-muted/15 px-2 py-1.5"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-1">
                              <p className="text-[11px] font-semibold text-foreground">
                                {CNC_EVENTO_LABELS[evento.tipoEvento] ??
                                  evento.tipoEvento}
                              </p>
                              <time
                                dateTime={evento.createdAt}
                                className="text-[10px] text-muted-foreground"
                              >
                                {formatCncDate(evento.createdAt)}
                              </time>
                            </div>
                            {evento.descricao ? (
                              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                                {evento.descricao}
                              </p>
                            ) : null}
                            {detalhes.length > 0 ? (
                              <p className="mt-1 text-[10px] leading-relaxed text-foreground/85">
                                {detalhes.join(' · ')}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                </details>
              ) : null}

              {analiseSugerida ? (
                <div className="mt-2.5 flex gap-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2">
                  <Lightbulb
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Orientação
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/90">
                      {analiseSugerida}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}

      {modalEditar ? (
        <ModalEditarItemCnc
          open={modalEditar}
          item={item}
          processando={processando}
          onOpenChange={setModalEditar}
          onConfirm={(body) => {
            void atualizar(item.id, body).then(() => setModalEditar(false));
          }}
        />
      ) : null}

      {modalRemover ? (
        <AlertDialog open={modalRemover} onOpenChange={setModalRemover}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover item da CNC?</AlertDialogTitle>
              <AlertDialogDescription>
                O item{' '}
                <strong>
                  {item.sku ?? item.descricaoProduto ?? 'selecionado'}
                </strong>{' '}
                será removido permanentemente desta não conformidade. Esta ação
                ficará registrada no histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processando}>
                Cancelar
              </AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                disabled={processando}
                onClick={() => void handleRemover()}
              >
                Remover item
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Fragment>
  );
}
