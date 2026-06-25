'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

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
import { Loader2 } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/docas/components/form-field-classes';
import {
  DEFAULT_TRANSPORTADORA_FORM,
  TRANSPORTADORA_STATUS_LABELS,
  transportadoraFormSchema,
  type TransportadoraFormValues,
  type TransportadoraListaItem,
} from '@/features/transporte/types/transportadora.schema';

type TransportadoraFormDialogProps = {
  open: boolean;
  editingItem: TransportadoraListaItem | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransportadoraFormValues) => void | Promise<void>;
};

export function TransportadoraFormDialog({
  open,
  editingItem,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TransportadoraFormDialogProps) {
  const isEdicao = Boolean(editingItem);

  const form = useForm<TransportadoraFormValues>({
    resolver: zodResolver(transportadoraFormSchema),
    defaultValues: DEFAULT_TRANSPORTADORA_FORM,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingItem) {
      form.reset({
        nome: editingItem.nome,
        idRavexTransportadora: editingItem.idRavexTransportadora,
        cnpj: editingItem.cnpj,
        status: editingItem.status,
      });
    } else {
      form.reset(DEFAULT_TRANSPORTADORA_FORM);
    }

    form.clearErrors();
  }, [open, editingItem, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const onValidSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdicao ? 'Editar transportadora' : 'Nova transportadora'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdicao
              ? 'Atualize os dados da transportadora parceira.'
              : 'Cadastre uma nova transportadora para integração com o Ravex.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onValidSubmit} noValidate>
          <div>
            <label htmlFor="transportadora-nome" className={fieldLabelClassName}>
              Nome da transportadora <span className="text-destructive">*</span>
            </label>
            <input
              id="transportadora-nome"
              className={fieldInputClassName}
              placeholder="Ex: LogiTech Transportes S.A."
              aria-invalid={Boolean(form.formState.errors.nome)}
              {...form.register('nome')}
            />
            {form.formState.errors.nome?.message ? (
              <p className={fieldErrorClassName} role="alert">
                {form.formState.errors.nome.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="transportadora-id-ravex"
              className={fieldLabelClassName}
            >
              ID Ravex <span className="text-destructive">*</span>
            </label>
            <input
              id="transportadora-id-ravex"
              type="number"
              min={1}
              step={1}
              className={cn(fieldInputClassName, 'font-mono')}
              placeholder="Ex: 12345"
              disabled={isEdicao}
              aria-invalid={Boolean(form.formState.errors.idRavexTransportadora)}
              {...form.register('idRavexTransportadora', {
                valueAsNumber: true,
              })}
            />
            {form.formState.errors.idRavexTransportadora?.message ? (
              <p className={fieldErrorClassName} role="alert">
                {form.formState.errors.idRavexTransportadora.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="transportadora-cnpj" className={fieldLabelClassName}>
              CNPJ <span className="text-destructive">*</span>
            </label>
            <input
              id="transportadora-cnpj"
              className={cn(fieldInputClassName, 'font-mono')}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              maxLength={18}
              aria-invalid={Boolean(form.formState.errors.cnpj)}
              {...form.register('cnpj', {
                onChange: (event) => {
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 14);
                  let formatted = digits;

                  if (digits.length > 2) {
                    formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
                  }
                  if (digits.length > 5) {
                    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
                  }
                  if (digits.length > 8) {
                    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
                  }
                  if (digits.length > 12) {
                    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
                  }

                  form.setValue('cnpj', formatted, { shouldValidate: true });
                },
              })}
            />
            {form.formState.errors.cnpj?.message ? (
              <p className={fieldErrorClassName} role="alert">
                {form.formState.errors.cnpj.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="transportadora-status" className={fieldLabelClassName}>
              Status <span className="text-destructive">*</span>
            </label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <select
                  id="transportadora-status"
                  className={cn(fieldInputClassName, 'appearance-none')}
                  aria-invalid={Boolean(form.formState.errors.status)}
                  {...field}
                >
                  {(['ativa', 'inativa'] as const).map((status) => (
                    <option key={status} value={status}>
                      {TRANSPORTADORA_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              )}
            />
            {form.formState.errors.status?.message ? (
              <p className={fieldErrorClassName} role="alert">
                {form.formState.errors.status.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : isEdicao ? (
                'Atualizar'
              ) : (
                'Cadastrar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
