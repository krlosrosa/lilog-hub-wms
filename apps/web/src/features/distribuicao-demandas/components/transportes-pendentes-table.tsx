'use client';



import { Fragment } from 'react';

import { ChevronDown, ChevronRight, Shuffle } from 'lucide-react';



import { Button, cn } from '@lilog/ui';



import {

  compactTableBodyClassName,

  compactTableCellClassName,

  compactTableClassName,

  compactTableEmptyCellClassName,

  compactTableHeadCellClassName,

  compactTableHeadRowClassName,

  compactTableRowClassName,

} from '@/components/ui/compact-table-classes';

import {

  PRIORIDADE_LABEL,

  STATUS_LABEL,

  TransporteExpandidoDetalhe,

} from '@/features/distribuicao-demandas/components/transporte-expandido-detalhe';

import {

  distribuicaoPanelClassName,

  distribuicaoSectionTitleClassName,

} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';

import type { TransporteExpedicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';



export type TransportesPendentesTableProps = {

  transportes: TransporteExpedicao[];

  expandedTransporteIds: Set<string>;

  selectedTransporteIds: Set<string>;

  transportesSelecionaveis: TransporteExpedicao[];

  onToggleExpand: (transporteId: string) => void;

  onToggleSelect: (transporteId: string) => void;

  onToggleSelectAll: () => void;

  podeDistribuir?: boolean;

  onIniciarDistribuicao: () => void;

};



export function TransportesPendentesTable({

  transportes,

  expandedTransporteIds,

  selectedTransporteIds,

  transportesSelecionaveis,

  onToggleExpand,

  onToggleSelect,

  onToggleSelectAll,

  podeDistribuir = false,

  onIniciarDistribuicao,

}: TransportesPendentesTableProps) {

  const todosSelecionaveisMarcados =

    transportesSelecionaveis.length > 0 &&

    transportesSelecionaveis.every((t) => selectedTransporteIds.has(t.id));



  return (

    <section className={cn(distribuicaoPanelClassName, 'overflow-hidden')}>

      <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-high/50 px-gutter py-3">

        <div className="flex items-center gap-2">

          <Shuffle className="size-4 text-muted-foreground" aria-hidden />

          <h2 className={distribuicaoSectionTitleClassName}>

            Transportes pendentes

          </h2>

          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">

            {transportes.length}

          </span>

        </div>

        <Button size="sm" disabled={!podeDistribuir} onClick={onIniciarDistribuicao}>

          Distribuir selecionados ({selectedTransporteIds.size})

        </Button>

      </div>



      <div className="overflow-x-auto">

        <table className={compactTableClassName}>

          <thead>

            <tr className={compactTableHeadRowClassName}>

              <th className={compactTableHeadCellClassName('w-8')}>

                <input

                  type="checkbox"

                  className="size-3.5"

                  checked={todosSelecionaveisMarcados}

                  onChange={onToggleSelectAll}

                  aria-label="Selecionar todos com mapa gerado"

                />

              </th>

              <th className={compactTableHeadCellClassName('w-8')} />

              <th className={compactTableHeadCellClassName()}>Transporte</th>

              <th className={compactTableHeadCellClassName()}>Placa</th>

              <th className={compactTableHeadCellClassName()}>Transportadora</th>

              <th className={compactTableHeadCellClassName()}>Empresa</th>

              <th className={compactTableHeadCellClassName()}>Prioridade</th>

              <th className={compactTableHeadCellClassName()}>Mapas</th>

              <th className={compactTableHeadCellClassName()}>Peso</th>

              <th className={compactTableHeadCellClassName()}>Caixas</th>

              <th className={compactTableHeadCellClassName()}>Paletes</th>

              <th className={compactTableHeadCellClassName()}>Carros</th>

              <th className={compactTableHeadCellClassName()}>Saída</th>

              <th className={compactTableHeadCellClassName()}>Status</th>

            </tr>

          </thead>

          <tbody className={compactTableBodyClassName}>

            {transportes.length === 0 ? (

              <tr>

                <td colSpan={13} className={compactTableEmptyCellClassName}>

                  Nenhum transporte pendente no momento.

                </td>

              </tr>

            ) : (

              transportes.map((transporte) => {

                const expanded = expandedTransporteIds.has(transporte.id);

                const selecionavel = transporte.temMapaGerado;

                const selecionado = selectedTransporteIds.has(transporte.id);



                return (

                  <Fragment key={transporte.id}>

                    <tr

                      className={cn(

                        compactTableRowClassName,

                        expanded && 'bg-surface-highest/30',

                        selecionado && 'bg-primary/5',

                      )}

                    >

                      <td className={compactTableCellClassName}>

                        <input

                          type="checkbox"

                          className="size-3.5"

                          checked={selecionado}

                          disabled={!selecionavel}

                          title={

                            selecionavel

                              ? 'Incluir na distribuição'

                              : 'Mapa ainda não gerado'

                          }

                          onChange={() => onToggleSelect(transporte.id)}

                          onClick={(e) => e.stopPropagation()}

                        />

                      </td>

                      <td

                        className={cn(compactTableCellClassName, 'cursor-pointer')}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {expanded ? (

                          <ChevronDown className="size-3.5 text-muted-foreground" />

                        ) : (

                          <ChevronRight className="size-3.5 text-muted-foreground" />

                        )}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer font-mono font-semibold',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.codigo}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer font-mono',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.placa}

                      </td>

                      <td

                        className={cn(compactTableCellClassName, 'cursor-pointer')}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.transportadora}

                      </td>

                      <td

                        className={cn(compactTableCellClassName, 'cursor-pointer')}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.empresa}

                      </td>

                      <td

                        className={cn(compactTableCellClassName, 'cursor-pointer')}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {PRIORIDADE_LABEL[transporte.prioridade]}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer tabular-nums',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.temMapaGerado ? transporte.totalMapas : '—'}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer tabular-nums',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.pesoTotalKg.toLocaleString('pt-BR')} kg

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer tabular-nums',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.caixas}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer tabular-nums',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.temMapaGerado ? transporte.totalPaletes : '—'}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer tabular-nums',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.carros}

                      </td>

                      <td

                        className={cn(

                          compactTableCellClassName,

                          'cursor-pointer font-mono',

                        )}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {transporte.horarioSaida}

                      </td>

                      <td

                        className={cn(compactTableCellClassName, 'cursor-pointer')}

                        onClick={() => onToggleExpand(transporte.id)}

                      >

                        {STATUS_LABEL[transporte.status]}

                        {!transporte.temMapaGerado ? (

                          <span className="ml-1 text-[10px] text-muted-foreground">

                            (sem mapa)

                          </span>

                        ) : null}

                      </td>

                    </tr>

                    {expanded ? (

                      <tr>

                        <td colSpan={13} className="p-0">

                          <TransporteExpandidoDetalhe transporte={transporte} />

                        </td>

                      </tr>

                    ) : null}

                  </Fragment>

                );

              })

            )}

          </tbody>

        </table>

      </div>

    </section>

  );

}

