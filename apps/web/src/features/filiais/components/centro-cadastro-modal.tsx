'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { useForm } from 'react-hook-form';

import { Button, cn } from '@lilog/ui';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/filiais/components/form-field-classes';
import {
  centroCadastroSchema,
  type CentroCadastroFormValues,
  empresaOptions,
} from '@/features/filiais/types/centro-cadastro.schema';
import type { CentroAtrelado } from '@/features/filiais/types/filial.schema';

export type CentroCadastroModalProps = {
  centroParaEdicao: CentroAtrelado | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSubmitCentro: (
    data: CentroCadastroFormValues,
    editingInternalRowId: string | null,
  ) => void | Promise<void>;
};

function bindDialog(open: boolean, dialogRef: RefObject<HTMLDialogElement | null>) {
  const el = dialogRef.current;

  if (!el) return;

  if (open && !el.open) {
    el.showModal();
  }

  if (!open && el.open) {
    el.close();
  }
}

function CentroCadastroModalContent({
  centroParaEdicao,
  open,
  onOpenChange,
  onSubmitCentro,
}: CentroCadastroModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  const form = useForm<CentroCadastroFormValues>({
    resolver: zodResolver(centroCadastroSchema),
    defaultValues: {
      centro: '',
      nome: '',
      empresa: 'LDB',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    bindDialog(open, dialogRef);
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;

    if (!el) return;

    const onNativeClose = () => {
      if (!el.open) {
        onOpenChange(false);
      }
    };

    el.addEventListener('cancel', onNativeClose);
    el.addEventListener('close', onNativeClose);

    return () => {
      el.removeEventListener('cancel', onNativeClose);
      el.removeEventListener('close', onNativeClose);
    };
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (centroParaEdicao) {
      form.reset({
        centro: centroParaEdicao.centro,
        nome: centroParaEdicao.nome,
        empresa: centroParaEdicao.empresa,
      });
    } else {
      form.reset({
        centro: '',
        nome: '',
        empresa: 'LDB',
      });
    }

    form.clearErrors();
  }, [open, centroParaEdicao, form]);

  const fechar = useCallback(() => {
    dialogRef.current?.close();
    onOpenChange(false);
  }, [onOpenChange]);

  const onValidSubmit = form.handleSubmit(async (data: CentroCadastroFormValues) => {
    const editingInternalRowId = centroParaEdicao?.id ?? null;

    await Promise.resolve(onSubmitCentro(data, editingInternalRowId));
    fechar();
  });

  const isEdicao = Boolean(centroParaEdicao);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'lilog-dialog-modal z-[100] overflow-y-auto rounded-xl border border-outline-variant bg-card p-6 text-card-foreground shadow-lg',
      )}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-headline-md font-semibold text-foreground">
            {isEdicao ? 'Editar centro' : 'Cadastrar centro'}
          </h2>
          <p id={descId} className="mt-1 text-body-md text-muted-foreground">
            {isEdicao
              ? 'Atualize o centro de 4 dígitos, nome ou empresa.'
              : 'Informe o centro de 4 dígitos, nome e empresa.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fechar()}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <form className="space-y-5" onSubmit={onValidSubmit} noValidate>
        <div>
          <label htmlFor={`${titleId}-centro`} className={fieldLabelClassName}>
            Código do centro (4 dígitos) <span className="text-destructive">*</span>
          </label>
          <input
            id={`${titleId}-centro`}
            className={fieldInputClassName}
            autoComplete="off"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="Ex: 1001"
            aria-invalid={Boolean(form.formState.errors.centro)}
            {...form.register('centro', {
              onChange: (event) => {
                const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 4);
                form.setValue('centro', digitsOnly, { shouldValidate: true });
              },
            })}
          />
          {form.formState.errors.centro?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {form.formState.errors.centro.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${titleId}-centro-nome`} className={fieldLabelClassName}>
            Nome do centro <span className="text-destructive">*</span>
          </label>
          <input
            id={`${titleId}-centro-nome`}
            className={fieldInputClassName}
            autoComplete="organization"
            placeholder="Nome do centro"
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
          <label htmlFor={`${titleId}-empresa`} className={fieldLabelClassName}>
            Empresa <span className="text-destructive">*</span>
          </label>
          <select
            id={`${titleId}-empresa`}
            className={cn(fieldInputClassName, 'appearance-none')}
            aria-invalid={Boolean(form.formState.errors.empresa)}
            {...form.register('empresa')}
          >
            {empresaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.formState.errors.empresa?.message ? (
            <p className={fieldErrorClassName} role="alert">
              {form.formState.errors.empresa.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => fechar()}>
            Cancelar
          </Button>
          <Button type="submit">{isEdicao ? 'Atualizar centro' : 'Salvar centro'}</Button>
        </div>
      </form>
    </dialog>
  );
}

export function CentroCadastroModal(props: CentroCadastroModalProps) {
  const instanceKey = `${props.open ? 'open' : 'closed'}-${props.centroParaEdicao?.id ?? 'novo'}`;

  return <CentroCadastroModalContent key={instanceKey} {...props} />;
}
