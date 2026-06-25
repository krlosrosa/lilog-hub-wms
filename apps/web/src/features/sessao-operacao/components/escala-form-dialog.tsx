'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
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
import { Loader2 } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/funcionarios/components/funcionario-form-field-classes';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import {
  DEFAULT_ESCALA_FORM,
  escalaFormSchema,
  inferCruzaMeiaNoite,
  type EscalaFormValues,
} from '@/features/sessao-operacao/types/escala.schema';

type EscalaFormDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EscalaFormValues) => void | Promise<void>;
};

export function EscalaFormDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EscalaFormDialogProps) {
  const form = useForm<EscalaFormValues>({
    resolver: zodResolver(escalaFormSchema),
    defaultValues: DEFAULT_ESCALA_FORM,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(DEFAULT_ESCALA_FORM);
    form.clearErrors();
  }, [open, form]);

  const horaInicio = form.watch('horaInicio');
  const horaFim = form.watch('horaFim');
  const cruzaMeiaNoite = useMemo(
    () => inferCruzaMeiaNoite(horaInicio, horaFim),
    [horaInicio, horaFim],
  );

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
          <DialogTitle className="text-foreground">Nova escala</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crie a escala e a equipe vinculada em um único passo.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onValidSubmit} noValidate>
          <div>
            <label htmlFor="nomeEscala" className={fieldLabelClassName}>
              Nome da escala
            </label>
            <input
              id="nomeEscala"
              {...form.register('nomeEscala')}
              placeholder="Ex: Manhã Expedição"
              className={fieldInputClassName}
            />
            {form.formState.errors.nomeEscala && (
              <p className={fieldErrorClassName}>
                {form.formState.errors.nomeEscala.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nomeEquipe" className={fieldLabelClassName}>
              Nome da equipe
            </label>
            <input
              id="nomeEquipe"
              {...form.register('nomeEquipe')}
              placeholder="Ex: Equipe Picking A"
              className={fieldInputClassName}
            />
            {form.formState.errors.nomeEquipe && (
              <p className={fieldErrorClassName}>
                {form.formState.errors.nomeEquipe.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="area" className={fieldLabelClassName}>
              Área (opcional)
            </label>
            <input
              id="area"
              {...form.register('area')}
              placeholder="Ex: Expedição"
              className={fieldInputClassName}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="horaInicio" className={fieldLabelClassName}>
                Início planejado
              </label>
              <input
                id="horaInicio"
                type="time"
                {...form.register('horaInicio')}
                className={fieldInputClassName}
              />
              {form.formState.errors.horaInicio && (
                <p className={fieldErrorClassName}>
                  {form.formState.errors.horaInicio.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="horaFim" className={fieldLabelClassName}>
                Fim planejado
              </label>
              <input
                id="horaFim"
                type="time"
                {...form.register('horaFim')}
                className={fieldInputClassName}
              />
              {form.formState.errors.horaFim && (
                <p className={fieldErrorClassName}>
                  {form.formState.errors.horaFim.message}
                </p>
              )}
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-highest px-3 py-2 text-body-sm text-muted-foreground',
            )}
          >
            <span>Prévia do turno:</span>
            {cruzaMeiaNoite ? (
              <EscalaTurnoBadge cruzaMeiaNoite />
            ) : (
              <span className="font-medium text-foreground">Diurno</span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              )}
              Criar escala
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
