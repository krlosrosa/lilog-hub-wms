'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search, X } from 'lucide-react';
import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/produto-endereco/components/form-field-classes';
import {
  createProdutoEndereco,
  updateProdutoEndereco,
} from '@/features/produto-endereco/lib/produto-endereco-api';
import type { ProdutoEnderecoApi } from '@/features/produto-endereco/types/produto-endereco.api';
import {
  enderecoTiposCompativeisComPapel,
  PAPEL_PRODUTO_ENDERECO_LABELS,
  produtoEnderecoFormSchema,
  type ProdutoEnderecoFormValues,
  type ProdutoEnderecoPapelForm,
} from '@/features/produto-endereco/types/produto-endereco.schema';
import {
  formatCentroLabel,
  listCentros,
  listEnderecos,
} from '@/features/enderecos/lib/endereco-api';
import type { CentroOptionApi } from '@/features/enderecos/types/endereco.api';
import { listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import { ApiClientError } from '@/lib/api';

type EnderecoOption = {
  id: string;
  label: string;
};

export type ProdutoEnderecoFormModalProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  editingItem: ProdutoEnderecoApi | null;
  unidadeId?: string;
  defaultCentroId?: string;
  onSaved: () => void;
};

function bindDialog(open: boolean, dialogRef: RefObject<HTMLDialogElement | null>) {
  const el = dialogRef.current;
  if (!el) return;
  if (open && !el.open) el.showModal();
  if (!open && el.open) el.close();
}

export function ProdutoEnderecoFormModal({
  open,
  onOpenChange,
  editingItem,
  unidadeId,
  defaultCentroId,
  onSaved,
}: ProdutoEnderecoFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isEdit = editingItem !== null;

  const [centros, setCentros] = useState<CentroOptionApi[]>([]);
  const [enderecoOpcoes, setEnderecoOpcoes] = useState<EnderecoOption[]>([]);
  const [produtoOpcoes, setProdutoOpcoes] = useState<ProdutoApi[]>([]);
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoApi | null>(
    null,
  );
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProdutoEnderecoFormValues>({
    resolver: zodResolver(produtoEnderecoFormSchema),
    defaultValues: {
      centroId: '',
      produtoId: '',
      enderecoId: '',
      papel: 'picking_primario',
      ordem: 1,
      ativo: true,
    },
    mode: 'onSubmit',
  });

  const centroId = form.watch('centroId');
  const papel = form.watch('papel');

  useEffect(() => {
    bindDialog(open, dialogRef);
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const onNativeClose = () => {
      if (!el.open) onOpenChange(false);
    };

    el.addEventListener('cancel', onNativeClose);
    el.addEventListener('close', onNativeClose);
    return () => {
      el.removeEventListener('cancel', onNativeClose);
      el.removeEventListener('close', onNativeClose);
    };
  }, [onOpenChange]);

  useEffect(() => {
    if (!open || !unidadeId) return;

    void listCentros(unidadeId).then(setCentros).catch(() => {
      toast.error('Não foi possível carregar os centros');
    });
  }, [open, unidadeId]);

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      form.reset({
        centroId: editingItem.centroId,
        produtoId: editingItem.produtoId,
        enderecoId: editingItem.enderecoId,
        papel: editingItem.papel,
        ordem: editingItem.ordem,
        ativo: editingItem.ativo,
      });
      setProdutoSelecionado({
        produtoId: editingItem.produto.produtoId,
        sku: editingItem.produto.sku,
        descricao: editingItem.produto.descricao,
      } as ProdutoApi);
      setProdutoBusca(editingItem.produto.sku);
      return;
    }

    form.reset({
      centroId: defaultCentroId ?? '',
      produtoId: '',
      enderecoId: '',
      papel: 'picking_primario',
      ordem: 1,
      ativo: true,
    });
    setProdutoSelecionado(null);
    setProdutoBusca('');
  }, [open, editingItem, defaultCentroId, form]);

  useEffect(() => {
    if (!open || !centroId) {
      setEnderecoOpcoes([]);
      return;
    }

    const tipos = enderecoTiposCompativeisComPapel(papel);

    setCarregandoEnderecos(true);
    void Promise.all(
      tipos.map((tipo) => listEnderecos({ centroId, tipo, limit: 100 })),
    )
      .then((responses) => {
        const seen = new Set<string>();
        const opcoes: { id: string; label: string }[] = [];

        for (const response of responses) {
          for (const item of response.items) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            opcoes.push({ id: item.id, label: item.enderecoMascarado });
          }
        }

        opcoes.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
        setEnderecoOpcoes(opcoes);
      })
      .catch(() => {
        toast.error('Não foi possível carregar os endereços');
        setEnderecoOpcoes([]);
      })
      .finally(() => setCarregandoEnderecos(false));
  }, [open, centroId, papel]);

  useEffect(() => {
    if (!open || isEdit) return;

    const term = produtoBusca.trim();
    if (term.length < 2) {
      setProdutoOpcoes([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setCarregandoProdutos(true);
      void listProdutos({ search: term, limit: 20 })
        .then((response) => setProdutoOpcoes(response.items))
        .catch(() => setProdutoOpcoes([]))
        .finally(() => setCarregandoProdutos(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, produtoBusca, isEdit]);

  const selecionarProduto = useCallback(
    (produto: ProdutoApi) => {
      setProdutoSelecionado(produto);
      setProdutoBusca(produto.sku);
      form.setValue('produtoId', produto.produtoId, { shouldValidate: true });
      setProdutoOpcoes([]);
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);

    try {
      if (isEdit && editingItem) {
        await updateProdutoEndereco(editingItem.id, {
          enderecoId: values.enderecoId,
          papel: values.papel,
          ordem: values.ordem,
          ativo: values.ativo,
        });
        toast.success('Alocação atualizada');
      } else {
        await createProdutoEndereco({
          centroId: values.centroId,
          produtoId: values.produtoId,
          enderecoId: values.enderecoId,
          papel: values.papel,
          ordem: values.ordem,
          ativo: values.ativo,
        });
        toast.success('Alocação criada');
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível salvar a alocação';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-auto w-[min(100%,32rem)] max-h-[90vh] overflow-y-auto rounded-xl border border-outline-variant bg-card p-0 shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={onSubmit} className="flex flex-col">
        <div className="flex items-start justify-between border-b border-outline-variant px-6 py-4">
          <div>
            <h2 id={titleId} className="text-headline-md font-semibold text-foreground">
              {isEdit ? 'Editar alocação' : 'Nova alocação'}
            </h2>
            <p className="mt-1 text-body-md text-muted-foreground">
              Vincule um produto a um endereço de picking ou pulmão.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="centroId" className={fieldLabelClassName}>
              Centro
            </label>
            <select
              id="centroId"
              disabled={isEdit}
              className={cn(fieldInputClassName, isEdit && 'opacity-70')}
              {...form.register('centroId')}
            >
              <option value="">Selecione...</option>
              {centros.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {formatCentroLabel(centro)}
                </option>
              ))}
            </select>
            {form.formState.errors.centroId && (
              <p className={fieldErrorClassName}>
                {form.formState.errors.centroId.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="produtoBusca" className={fieldLabelClassName}>
              Produto
            </label>
            {isEdit ? (
              <p className={fieldInputClassName}>
                {produtoSelecionado?.sku} — {produtoSelecionado?.descricao}
              </p>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="produtoBusca"
                    type="search"
                    value={produtoBusca}
                    onChange={(event) => setProdutoBusca(event.target.value)}
                    placeholder="Buscar por SKU ou descrição..."
                    className={cn(fieldInputClassName, 'pl-9')}
                  />
                </div>
                {carregandoProdutos && (
                  <p className="mt-1 text-caption text-muted-foreground">
                    Buscando produtos...
                  </p>
                )}
                {produtoOpcoes.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-outline-variant">
                    {produtoOpcoes.map((produto) => (
                      <li key={produto.produtoId}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-body-md hover:bg-muted"
                          onClick={() => selecionarProduto(produto)}
                        >
                          <span className="font-mono text-caption text-muted-foreground">
                            {produto.sku}
                          </span>
                          <span className="block text-foreground">
                            {produto.descricao}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {produtoSelecionado && (
                  <p className="mt-1 text-caption text-primary">
                    Selecionado: {produtoSelecionado.sku}
                  </p>
                )}
                <input type="hidden" {...form.register('produtoId')} />
                {form.formState.errors.produtoId && (
                  <p className={fieldErrorClassName}>
                    {form.formState.errors.produtoId.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="papel" className={fieldLabelClassName}>
              Papel
            </label>
            <select
              id="papel"
              className={fieldInputClassName}
              {...form.register('papel')}
            >
              {(Object.keys(PAPEL_PRODUTO_ENDERECO_LABELS) as ProdutoEnderecoPapelForm[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {PAPEL_PRODUTO_ENDERECO_LABELS[key]}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label htmlFor="enderecoId" className={fieldLabelClassName}>
              Endereço
            </label>
            <select
              id="enderecoId"
              disabled={!centroId || carregandoEnderecos}
              className={fieldInputClassName}
              {...form.register('enderecoId')}
            >
              <option value="">
                {carregandoEnderecos ? 'Carregando...' : 'Selecione...'}
              </option>
              {enderecoOpcoes.map((endereco) => (
                <option key={endereco.id} value={endereco.id}>
                  {endereco.label}
                </option>
              ))}
            </select>
            {form.formState.errors.enderecoId && (
              <p className={fieldErrorClassName}>
                {form.formState.errors.enderecoId.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ordem" className={fieldLabelClassName}>
              Ordem
            </label>
            <input
              id="ordem"
              type="number"
              min={1}
              className={fieldInputClassName}
              {...form.register('ordem', { valueAsNumber: true })}
            />
            {form.formState.errors.ordem && (
              <p className={fieldErrorClassName}>
                {form.formState.errors.ordem.message}
              </p>
            )}
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-body-md text-foreground">
              <input type="checkbox" {...form.register('ativo')} />
              Alocação ativa
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isEdit ? 'Salvar' : 'Criar alocação'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
