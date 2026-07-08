'use client';

import { useCallback, useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { importProdutoEnderecos } from '@/features/produto-endereco/lib/produto-endereco-api';
import type {
  ErroImportacaoProdutoEndereco,
  ImportProdutoEnderecosResponse,
} from '@/features/produto-endereco/types/produto-endereco.api';
import { ApiClientError } from '@/lib/api';

type ProdutoEnderecosImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ProdutoEnderecosImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProdutoEnderecosImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ImportProdutoEnderecosResponse | null>(
    null,
  );
  const [erros, setErros] = useState<ErroImportacaoProdutoEndereco[]>([]);
  const [errosDialogAberto, setErrosDialogAberto] = useState(false);

  const resetarEstado = useCallback(() => {
    setResultado(null);
    setErros([]);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetarEstado();
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange, resetarEstado],
  );

  const processarArquivo = useCallback(
    async (file: File) => {
      setImportando(true);
      resetarEstado();

      try {
        const response = await importProdutoEnderecos(file);
        setResultado(response);

        if (response.errors.length > 0) {
          setErros(response.errors);
        }

        if (response.inserted > 0 || response.updated > 0) {
          toast.success(
            `${response.inserted} inserido(s), ${response.updated} atualizado(s)${response.errors.length > 0 ? `. ${response.errors.length} linha(s) com erro.` : '.'}`,
            { duration: 6000 },
          );
          onSuccess?.();
        } else if (response.errors.length > 0) {
          toast.warning(
            `Nenhuma alocação importada. ${response.errors.length} linha(s) com erro.`,
            { duration: 6000 },
          );
        } else {
          toast.info('Nenhuma alocação encontrada no arquivo.', { duration: 4000 });
        }
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Erro ao importar arquivo';
        toast.error(message, { duration: 6000 });
      } finally {
        setImportando(false);
      }
    },
    [onSuccess, resetarEstado],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Selecione um arquivo .xlsx');
        return;
      }

      void processarArquivo(file);
    },
    [processarArquivo],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Selecione um arquivo .xlsx');
        return;
      }

      void processarArquivo(file);
    },
    [processarArquivo],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="border-outline-variant bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Importar slotting via Excel
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Envie a planilha exportada com SKU, Produto ID, Papel, Ordem e
              Ativo preenchidos. Linhas sem produto são ignoradas.
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-muted/20 px-6 py-10 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {importando ? (
              <>
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-body-md text-muted-foreground">
                  Processando arquivo...
                </p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-body-md text-foreground">
                  Arraste o arquivo .xlsx ou clique para selecionar
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {resultado ? (
            <div className="rounded-lg border border-outline-variant bg-muted/10 px-4 py-3 text-body-md text-foreground">
              <p>
                <strong>{resultado.inserted}</strong> inserido(s),{' '}
                <strong>{resultado.updated}</strong> atualizado(s)
                {resultado.errors.length > 0 ? (
                  <>
                    , <strong>{resultado.errors.length}</strong> erro(s)
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            {resultado && resultado.errors.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setErrosDialogAberto(true)}
              >
                Ver erros
              </Button>
            ) : (
              <span />
            )}

            <Button type="button" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={errosDialogAberto} onOpenChange={setErrosDialogAberto}>
        <AlertDialogContent className="border-outline-variant bg-card max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Erros da importação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {erros.length} linha(s) não puderam ser importadas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-80 overflow-auto rounded-lg border border-outline-variant">
            <table className={compactTableClassName}>
              <thead>
                <tr className={compactTableHeadRowClassName}>
                  <th className={compactTableHeadCellClassName()}>Linha</th>
                  <th className={compactTableHeadCellClassName()}>Endereço</th>
                  <th className={compactTableHeadCellClassName()}>SKU</th>
                  <th className={compactTableHeadCellClassName()}>Campo</th>
                  <th className={compactTableHeadCellClassName()}>Mensagem</th>
                </tr>
              </thead>
              <tbody className={compactTableBodyClassName}>
                {erros.map((erro) => (
                  <tr key={`${erro.linha}-${erro.campo}-${erro.mensagem}`}>
                    <td className={compactTableCellClassName}>{erro.linha}</td>
                    <td className={compactTableCellClassName}>{erro.endereco}</td>
                    <td className={compactTableCellClassName}>{erro.sku}</td>
                    <td className={compactTableCellClassName}>{erro.campo}</td>
                    <td className={compactTableCellClassName}>{erro.mensagem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
