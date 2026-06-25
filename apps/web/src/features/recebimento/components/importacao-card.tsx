'use client';

import { useCallback, useRef } from 'react';

import { FileSpreadsheet, FileText, UploadCloud } from 'lucide-react';

import { Button } from '@lilog/ui';
import { toast } from 'sonner';

type EstadoImportRecebimento = 'idle' | 'loaded';

export const MOCK_ITENS_IMPORT_TOTAL = 24;

const PREVIEW_ROWS = [
  {
    id: '1',
    sku: 'LOG-IT-8821',
    descricao: 'Router Enterprise X100',
    qtd: 150,
    vlrUnit: 890,
  },
  {
    id: '2',
    sku: 'LOG-IT-2290',
    descricao: 'Patch Cord Cat6 2m — Black',
    qtd: 1200,
    vlrUnit: 12.5,
  },
  {
    id: '3',
    sku: 'LOG-IT-1104',
    descricao: 'Server Chassis Rack 4U',
    qtd: 10,
    vlrUnit: 2450,
  },
];

const formatoBrl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatoInt = new Intl.NumberFormat('pt-BR');

type ImportacaoCardProps = {
  estadoImport: EstadoImportRecebimento;
  onSimularImport: () => void;
  onLimparArquivo: () => void;
};

export function ImportacaoCard({
  estadoImport,
  onSimularImport,
  onLimparArquivo,
}: ImportacaoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const abrirExplorador = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onPickArquivo = useCallback(() => {
    onSimularImport();
    const el = inputRef.current;
    if (el) {
      el.value = '';
    }
  }, [onSimularImport]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSimularImport();
    },
    [onSimularImport],
  );

  const verTodos = useCallback(() => {
    toast.info('Lista completa (mock)', {
      description: `Pré-visualização truncada (${MOCK_ITENS_IMPORT_TOTAL} itens).`,
      duration: 2600,
    });
  }, []);

  return (
    <section
      className="flex min-h-[22rem] flex-col rounded-xl border border-outline-variant bg-card p-5 shadow-inner-glow transition-colors hover:border-primary/25 md:p-6"
      aria-labelledby="titulo-import"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <UploadCloud className="size-6 shrink-0 text-primary" aria-hidden />
          <h2
            id="titulo-import"
            className="text-headline-md font-bold uppercase tracking-wide text-foreground"
          >
            Importação de dados
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-caption text-muted-foreground">
            <FileText className="size-3.5" aria-hidden />
            .XML
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-caption text-muted-foreground">
            <FileSpreadsheet className="size-3.5" aria-hidden />
            .XLSX
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xml,.xlsx,application/xml,text/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={onPickArquivo}
      />

      {estadoImport === 'idle' ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-muted/10 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5 md:p-12"
          onClick={onSimularImport}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSimularImport();
            }
          }}
        >
          <div className="mb-6 flex size-20 shrink-0 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="size-10 text-muted-foreground" aria-hidden />
          </div>
          <p className="mb-2 text-center text-xl font-semibold text-foreground">
            Arraste e solte o arquivo aqui
          </p>
          <p className="mx-auto max-w-md text-center text-body-md text-muted-foreground">
            Envie a nota fiscal em XML ou a planilha Excel de romaneio para
            extração automática dos dados.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-8 rounded-full border-outline-variant"
            onClick={(ev) => {
              ev.stopPropagation();
              void abrirExplorador();
            }}
          >
            Selecionar arquivo
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h3 className="flex flex-wrap items-center gap-2 font-bold text-foreground">
              <span
                className="inline-flex size-2 shrink-0 rounded-full bg-status-active"
                aria-hidden
              />
              Itens extraídos ({MOCK_ITENS_IMPORT_TOTAL})
            </h3>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-caption text-primary"
              onClick={onLimparArquivo}
            >
              Limpar arquivo
            </Button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-label-md text-foreground">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      SKU
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Descrição
                    </th>
                    <th className="px-4 py-3 text-right font-semibold" scope="col">
                      Qtd.
                    </th>
                    <th className="px-4 py-3 text-right font-semibold" scope="col">
                      Vlr. unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 bg-muted/10">
                  {PREVIEW_ROWS.map((linha) => (
                    <tr
                      key={linha.id}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <td className="whitespace-nowrap px-4 py-3">{linha.sku}</td>
                      <td className="max-w-[12rem] truncate px-4 py-3 sm:max-w-none">
                        {linha.descricao}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {formatoInt.format(linha.qtd)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {formatoBrl.format(linha.vlrUnit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-outline-variant/50 bg-muted/25 px-4 py-3 text-center">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-caption text-muted-foreground hover:text-primary"
                onClick={verTodos}
              >
                Ver todos os {MOCK_ITENS_IMPORT_TOTAL} itens
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
