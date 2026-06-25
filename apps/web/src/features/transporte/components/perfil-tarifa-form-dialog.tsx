'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
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
import { RavexTipoVeiculoCombobox } from '@/features/transporte/components/ravex-tipo-veiculo-combobox';
import {
  listTiposVeiculoRavex,
  type RavexTipoVeiculo,
} from '@/features/transporte/lib/perfis-tarifas-api';
import {
  DEFAULT_PERFIL_TARIFA_FORM,
  TIPO_CARGA_LABELS,
  perfilTarifaFormSchema,
  type PerfilTarifaFormValues,
  type TipoCarga,
} from '@/features/transporte/types/perfil-tarifa.schema';

const compactInputClassName = cn(
  fieldInputClassName,
  'px-3 py-2 text-sm',
);

const compactLabelClassName = cn(fieldLabelClassName, 'mb-1 text-xs');

type PerfilTarifaFormDialogProps = {
  open: boolean;
  tipoCargaPadrao: TipoCarga;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PerfilTarifaFormValues) => void | Promise<void>;
};

export function PerfilTarifaFormDialog({
  open,
  tipoCargaPadrao,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: PerfilTarifaFormDialogProps) {
  const [tiposVeiculo, setTiposVeiculo] = useState<RavexTipoVeiculo[]>([]);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<RavexTipoVeiculo | null>(
    null,
  );

  const form = useForm<PerfilTarifaFormValues>({
    resolver: zodResolver(perfilTarifaFormSchema),
    defaultValues: {
      ...DEFAULT_PERFIL_TARIFA_FORM,
      tipoCarga: tipoCargaPadrao,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      ...DEFAULT_PERFIL_TARIFA_FORM,
      tipoCarga: tipoCargaPadrao,
    });
    form.clearErrors();
    setTipoSelecionado(null);

    let cancelled = false;

    async function loadTiposVeiculo() {
      setIsLoadingTipos(true);

      try {
        const tipos = await listTiposVeiculoRavex();

        if (!cancelled) {
          setTiposVeiculo(tipos);
        }
      } catch {
        if (!cancelled) {
          setTiposVeiculo([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTipos(false);
        }
      }
    }

    void loadTiposVeiculo();

    return () => {
      cancelled = true;
    };
  }, [form, open, tipoCargaPadrao]);

  const aplicarTipoVeiculo = (tipo: RavexTipoVeiculo) => {
    setTipoSelecionado(tipo);
    form.setValue('idRavex', tipo.id, { shouldValidate: true });
    form.setValue('nome', tipo.nome, { shouldValidate: true });
    form.setValue('peso', tipo.peso, { shouldValidate: true });
    form.setValue('cubagem', tipo.cubagem > 0 ? tipo.cubagem : undefined, {
      shouldValidate: true,
    });
    form.clearErrors(['idRavex', 'nome', 'peso', 'cubagem']);
  };

  const limparTipoVeiculo = () => {
    setTipoSelecionado(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'flex w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0',
          'max-h-[min(92dvh,680px)] sm:max-w-xl',
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-outline-variant/60 px-4 py-4 text-left sm:px-5">
          <DialogTitle className="text-base sm:text-lg">Novo perfil de tarifa</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Importe da Ravex ou preencha manualmente os dados do perfil.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 px-4 pt-4 sm:px-5">
              <RavexTipoVeiculoCombobox
                tipos={tiposVeiculo}
                tipoSelecionado={tipoSelecionado}
                isLoading={isLoadingTipos}
                isDisabled={isSubmitting}
                dialogOpen={open}
                onSelect={aplicarTipoVeiculo}
                onClear={limparTipoVeiculo}
              />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3">
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="perfil-form-nome" className={compactLabelClassName}>
                  Nome
                </label>
                <input
                  id="perfil-form-nome"
                  className={compactInputClassName}
                  {...form.register('nome')}
                />
                {form.formState.errors.nome ? (
                  <p className={fieldErrorClassName}>
                    {form.formState.errors.nome.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="perfil-form-ravex" className={compactLabelClassName}>
                  ID Ravex
                </label>
                <input
                  id="perfil-form-ravex"
                  type="number"
                  min={1}
                  className={compactInputClassName}
                  {...form.register('idRavex', { valueAsNumber: true })}
                />
                {form.formState.errors.idRavex ? (
                  <p className={fieldErrorClassName}>
                    {form.formState.errors.idRavex.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="perfil-form-tipo" className={compactLabelClassName}>
                  Tipo de carga
                </label>
                <Controller
                  control={form.control}
                  name="tipoCarga"
                  render={({ field }) => (
                    <select
                      id="perfil-form-tipo"
                      className={compactInputClassName}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {(Object.keys(TIPO_CARGA_LABELS) as TipoCarga[]).map(
                        (tipo) => (
                          <option key={tipo} value={tipo}>
                            {TIPO_CARGA_LABELS[tipo]}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="perfil-form-peso" className={compactLabelClassName}>
                  Peso máx. (kg)
                </label>
                <input
                  id="perfil-form-peso"
                  type="number"
                  min={1}
                  className={compactInputClassName}
                  {...form.register('peso', { valueAsNumber: true })}
                />
                {form.formState.errors.peso ? (
                  <p className={fieldErrorClassName}>
                    {form.formState.errors.peso.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="perfil-form-cubagem" className={compactLabelClassName}>
                  Cubagem (m³)
                </label>
                <input
                  id="perfil-form-cubagem"
                  type="number"
                  min={0}
                  step={0.1}
                  className={compactInputClassName}
                  {...form.register('cubagem', {
                    setValueAs: (value) =>
                      value === '' || value === null || value === undefined
                        ? undefined
                        : Number(value),
                  })}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="perfil-form-descricao" className={compactLabelClassName}>
                  Descrição
                  <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
                </label>
                <textarea
                  id="perfil-form-descricao"
                  rows={2}
                  className={cn(compactInputClassName, 'resize-none')}
                  placeholder="Uso recomendado deste perfil..."
                  {...form.register('descricao')}
                />
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-outline-variant/60 bg-surface-highest/20 px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              Salvar perfil
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
