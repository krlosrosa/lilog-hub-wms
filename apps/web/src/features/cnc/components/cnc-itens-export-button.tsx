'use client';

import { useCallback, useState } from 'react';

import { Button } from '@lilog/ui';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { listarCncItens } from '@/features/cnc/lib/cnc-api';
import { exportCncItensXlsx } from '@/features/cnc/lib/export-cnc-itens-xlsx';
import type { CncItensFiltros } from '@/features/cnc/types/cnc-itens-filtros';
import { mapCncItensFiltrosToApiParams } from '@/features/cnc/types/cnc-itens-filtros';

const EXPORT_PAGE_SIZE = 100;

type CncItensExportButtonProps = {
  unidadeId: string | null;
  filtros: CncItensFiltros;
  total: number;
  disabled?: boolean;
};

export function CncItensExportButton({
  unidadeId,
  filtros,
  total,
  disabled = false,
}: CncItensExportButtonProps) {
  const [exportando, setExportando] = useState(false);

  const handleExport = useCallback(async () => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade para exportar');
      return;
    }

    if (total === 0) {
      toast.info('Nenhum item para exportar');
      return;
    }

    setExportando(true);

    try {
      const apiParams = mapCncItensFiltrosToApiParams(filtros);
      const totalPaginas = Math.ceil(total / EXPORT_PAGE_SIZE);
      const paginas = Array.from({ length: totalPaginas }, (_, index) => index + 1);

      const responses = await Promise.all(
        paginas.map((page) =>
          listarCncItens(unidadeId, {
            page,
            limit: EXPORT_PAGE_SIZE,
            ...apiParams,
          }),
        ),
      );

      const items = responses.flatMap((response) => response.items);

      if (!items.length) {
        toast.info('Nenhum item para exportar');
        return;
      }

      exportCncItensXlsx(items, {
        filtros: {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
      });
      toast.success('Planilha Excel exportada com sucesso');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível exportar os itens';

      toast.error(message);
    } finally {
      setExportando(false);
    }
  }, [unidadeId, filtros, total]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5 text-[11px]"
      onClick={() => void handleExport()}
      disabled={disabled || exportando || !unidadeId || total === 0}
    >
      {exportando ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Download className="size-3.5" aria-hidden />
      )}
      Baixar Excel
    </Button>
  );
}
