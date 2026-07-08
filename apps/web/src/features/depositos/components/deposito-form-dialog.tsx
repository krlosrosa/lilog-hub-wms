'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';

import {
  DEPOSITO_FINALIDADE_OPTIONS,
  DEFAULT_DEPOSITO_FORM_VALUES,
  type DepositoFormValues,
  type DepositoListaItem,
  depositoFormSchema,
} from '@/features/depositos/types/depositos-gestao.schema';

const fieldInputClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

const fieldLabelClassName = 'block text-xs font-medium text-muted-foreground';

const fieldErrorClassName = 'mt-1 text-xs text-destructive';

type DepositoFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  deposito?: DepositoListaItem | null;
  isSubmitting: boolean;
  onSubmit: (values: DepositoFormValues) => Promise<void>;
};

function mapDepositoToFormValues(deposito: DepositoListaItem): DepositoFormValues {
  return {
    codigo: deposito.codigo,
    nome: deposito.nome,
    finalidade: deposito.finalidade,
    permiteVenda: deposito.permiteVenda,
    permitePicking: deposito.permitePicking,
    exigeEndereco: deposito.exigeEndereco,
    contaDisponivel: deposito.contaDisponivel,
  };
}

function BooleanField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface-highest p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 rounded border-outline-variant text-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

export function DepositoFormDialog({
  open,
  onOpenChange,
  mode,
  deposito,
  isSubmitting,
  onSubmit,
}: DepositoFormDialogProps) {
  const isEdit = mode === 'edit';

  const form = useForm<DepositoFormValues>({
    resolver: zodResolver(depositoFormSchema),
    defaultValues: DEFAULT_DEPOSITO_FORM_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEdit && deposito) {
      form.reset(mapDepositoToFormValues(deposito));
      return;
    }

    form.reset(DEFAULT_DEPOSITO_FORM_VALUES);
  }, [deposito, form, isEdit, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-outline-variant bg-card max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar depósito' : 'Novo depósito'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as configurações do depósito lógico.'
              : 'Cadastre um depósito customizado para a unidade selecionada.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabelClassName} htmlFor="deposito-codigo">
                Código
              </label>
              <input
                id="deposito-codigo"
                {...form.register('codigo')}
                disabled={isEdit || isSubmitting}
                placeholder="Ex.: RESERVA_01"
                className={cn(fieldInputClassName, 'mt-1 font-mono uppercase')}
              />
              {form.formState.errors.codigo && (
                <p className={fieldErrorClassName}>
                  {form.formState.errors.codigo.message}
                </p>
              )}
            </div>

            <div>
              <label className={fieldLabelClassName} htmlFor="deposito-nome">
                Nome
              </label>
              <input
                id="deposito-nome"
                {...form.register('nome')}
                disabled={isSubmitting || deposito?.sistema}
                placeholder="Ex.: Reserva Comercial"
                className={cn(fieldInputClassName, 'mt-1')}
              />
              {form.formState.errors.nome && (
                <p className={fieldErrorClassName}>
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={fieldLabelClassName} htmlFor="deposito-finalidade">
              Finalidade
            </label>
            <select
              id="deposito-finalidade"
              {...form.register('finalidade')}
              disabled={isEdit || isSubmitting}
              className={cn(fieldInputClassName, 'mt-1')}
            >
              {DEPOSITO_FINALIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BooleanField
              label="Permite venda"
              description="Saldo disponível para expedição comercial."
              checked={form.watch('permiteVenda')}
              onChange={(value) =>
                form.setValue('permiteVenda', value, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
            <BooleanField
              label="Permite picking"
              description="Pode ser origem de separação operacional."
              checked={form.watch('permitePicking')}
              onChange={(value) =>
                form.setValue('permitePicking', value, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
            <BooleanField
              label="Exige endereço"
              description="Movimentações precisam de endereço WMS."
              checked={form.watch('exigeEndereco')}
              onChange={(value) =>
                form.setValue('exigeEndereco', value, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
            <BooleanField
              label="Conta disponível"
              description="Entra no cálculo de estoque disponível."
              checked={form.watch('contaDisponivel')}
              onChange={(value) =>
                form.setValue('contaDisponivel', value, { shouldDirty: true })
              }
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              )}
              {isEdit ? 'Salvar alterações' : 'Criar depósito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
