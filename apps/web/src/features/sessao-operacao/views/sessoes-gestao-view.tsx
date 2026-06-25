'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { CalendarClock, Loader2, Plus, SearchX } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { SessaoTableRow } from '@/features/sessao-operacao/components/sessao-table-row';
import { useSessoesGestao } from '@/features/sessao-operacao/hooks/use-sessoes-gestao';
import { SESSAO_STATUS_LABELS } from '@/features/sessao-operacao/types/sessao.schema';
import type { SessaoTrabalhoStatusApi } from '@/features/sessao-operacao/types/sessao.api';

const TABLE_HEADERS = [
  { label: 'Escala / Equipe', className: 'min-w-[180px]' },
  { label: 'Data', className: 'hidden min-w-[100px] md:table-cell' },
  { label: 'Horário', className: 'min-w-[140px]' },
  { label: 'Funcionários', className: 'hidden min-w-[100px] lg:table-cell' },
  { label: 'Status', className: 'w-[110px]' },
  { label: '', className: 'w-28 text-right' },
] as const;

const STATUS_FILTRO_OPCOES: Array<{
  value: SessaoTrabalhoStatusApi | 'todos';
  label: string;
}> = [
  { value: 'todos', label: 'Todos os status' },
  ...Object.entries(SESSAO_STATUS_LABELS).map(([value, label]) => ({
    value: value as SessaoTrabalhoStatusApi,
    label,
  })),
];

export function SessoesGestaoView() {
  const {
    unidadeId,
    sessoes,
    total,
    pagina,
    setPagina,
    totalPaginas,
    dataReferencia,
    setDataReferencia,
    statusFiltro,
    setStatusFiltro,
    isLoading,
  } = useSessoesGestao();

  const listaVazia = !isLoading && sessoes.length === 0;

  return (
    <SidebarMain>
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <CalendarClock className="size-5" aria-hidden />
              <span className="text-label-md font-bold uppercase tracking-wide">
                Sessão Operação
              </span>
            </div>
            <h1 className="text-headline-sm font-bold text-foreground">
              Sessões de Trabalho
            </h1>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Planeje, abra e encerre sessões operacionais com controle de presença.
            </p>
          </div>
          <Button asChild disabled={!unidadeId}>
            <Link href="/sessao-operacao/sessoes/nova">
              <Plus className="size-4" aria-hidden />
              Nova sessão
            </Link>
          </Button>
        </div>

        {!unidadeId && (
          <div className="rounded-xl border border-dashed border-outline-variant bg-card p-6 text-body-sm text-muted-foreground">
            Selecione uma unidade para gerenciar sessões.
          </div>
        )}

        {unidadeId && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label
                  htmlFor="dataReferenciaFiltro"
                  className="mb-1 block text-caption text-muted-foreground"
                >
                  Data de referência
                </label>
                <input
                  id="dataReferenciaFiltro"
                  type="date"
                  value={dataReferencia}
                  onChange={(event) => {
                    setDataReferencia(event.target.value);
                    setPagina(1);
                  }}
                  className="h-10 rounded-lg border border-outline-variant bg-background px-3 text-body-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="statusFiltro"
                  className="mb-1 block text-caption text-muted-foreground"
                >
                  Status
                </label>
                <select
                  id="statusFiltro"
                  value={statusFiltro}
                  onChange={(event) => {
                    setStatusFiltro(
                      event.target.value as SessaoTrabalhoStatusApi | 'todos',
                    );
                    setPagina(1);
                  }}
                  className="h-10 rounded-lg border border-outline-variant bg-background px-3 text-body-sm"
                >
                  {STATUS_FILTRO_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header.label || 'actions'}
                        className={compactTableHeadCellClassName(header.className)}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        <Loader2 className="mx-auto size-5 animate-spin" />
                      </td>
                    </tr>
                  ) : listaVazia ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center">
                        <SearchX
                          className="mx-auto mb-2 size-8 text-muted-foreground"
                          aria-hidden
                        />
                        <p className="text-body-sm text-muted-foreground">
                          Nenhuma sessão encontrada para esta data.
                        </p>
                        <Button asChild variant="link" className="mt-2">
                          <Link href="/sessao-operacao/sessoes/nova">
                            Criar nova sessão
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    sessoes.map((sessao) => (
                      <SessaoTableRow key={sessao.id} sessao={sessao} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!listaVazia && total > 0 && (
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={total}
                itemsInicio={(pagina - 1) * 20 + (sessoes.length > 0 ? 1 : 0)}
                pageSize={20}
                resourceLabelPlural="sessões"
              />
            )}
          </>
        )}
      </div>
    </SidebarMain>
  );
}
