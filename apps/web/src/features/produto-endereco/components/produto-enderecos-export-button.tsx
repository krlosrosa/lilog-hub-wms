'use client';

import { useCallback, useState } from 'react';

import { Button } from '@lilog/ui';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { exportProdutoEnderecos } from '@/features/produto-endereco/lib/produto-endereco-api';
import type { ExportProdutoEnderecosParams } from '@/features/produto-endereco/types/produto-endereco.api';
import { ApiClientError } from '@/lib/api';

type ProdutoEnderecosExportButtonProps = {
  params: ExportProdutoEnderecosParams | null;
  disabled?: boolean;
};

export function ProdutoEnderecosExportButton({
  params,
  disabled = false,
}: ProdutoEnderecosExportButtonProps) {
  const [exportando, setExportando] = useState(false);

  const handleExport = useCallback(async () => {
    if (!params?.centroId) {
      toast.error('Selecione um centro para exportar');
      return;
    }

    setExportando(true);

    try {
      await exportProdutoEnderecos(params);
      toast.success('Planilha exportada com sucesso');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível exportar a planilha';
      toast.error(message);
    } finally {
      setExportando(false);
    }
  }, [params]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleExport()}
      disabled={disabled || exportando || !params?.centroId}
    >
      {exportando ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      Exportar Excel
    </Button>
  );
}
