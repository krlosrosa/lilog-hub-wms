'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { AlertTriangle, ArrowLeft, Check, Loader2, Search } from 'lucide-react';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/docas/components/form-field-classes';
import type {
  ConfirmarCadastroRavexPayload,
  TransportadoraRavexPreview,
} from '@/features/transporte/types/transportadora.api';
import {
  TRANSPORTADORA_STATUS_LABELS,
  formatCnpj,
  transportadoraFormSchema,
  type TransportadoraFormValues,
} from '@/features/transporte/types/transportadora.schema';

const buscaPlacaSchema = z.object({
  placa: z
    .string()
    .min(7, 'Informe a placa do veículo')
    .max(8, 'Placa deve ter no máximo 8 caracteres')
    .transform((value) => value.trim().toUpperCase()),
});

type BuscaPlacaFormValues = z.infer<typeof buscaPlacaSchema>;

type TransportadoraCadastroRapidoDialogProps = {
  open: boolean;
  isSearching: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onBuscar: (placa: string) => Promise<TransportadoraRavexPreview | null>;
  onConfirmar: (data: ConfirmarCadastroRavexPayload) => void | Promise<void>;
};

export function TransportadoraCadastroRapidoDialog({
  open,
  isSearching,
  isSubmitting,
  onOpenChange,
  onBuscar,
  onConfirmar,
}: TransportadoraCadastroRapidoDialogProps) {
  const [step, setStep] = useState<'buscar' | 'confirmar'>('buscar');
  const [preview, setPreview] = useState<TransportadoraRavexPreview | null>(null);
  const [sincronizarPlacas, setSincronizarPlacas] = useState(true);

  const buscaForm = useForm<BuscaPlacaFormValues>({
    resolver: zodResolver(buscaPlacaSchema),
    defaultValues: { placa: '' },
    mode: 'onSubmit',
  });

  const confirmarForm = useForm<TransportadoraFormValues>({
    resolver: zodResolver(transportadoraFormSchema),
    defaultValues: {
      nome: '',
      idRavexTransportadora: 0,
      cnpj: '',
      status: 'ativa',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      setStep('buscar');
      setPreview(null);
      setSincronizarPlacas(true);
      buscaForm.reset({ placa: '' });
      buscaForm.clearErrors();
      confirmarForm.reset();
      confirmarForm.clearErrors();
    }
  }, [open, buscaForm, confirmarForm]);

  const isBusy = isSearching || isSubmitting;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleBuscar = buscaForm.handleSubmit(async (data) => {
    const result = await onBuscar(data.placa);

    if (!result) {
      return;
    }

    setPreview(result);
    confirmarForm.reset({
      nome: result.nome,
      idRavexTransportadora: result.idRavexTransportadora,
      cnpj: formatCnpj(result.cnpj),
      status: 'ativa',
    });
    setStep('confirmar');
  });

  const handleConfirmar = confirmarForm.handleSubmit(async (data) => {
    if (!preview) {
      return;
    }

    await onConfirmar({
      idRavexTransportadora: data.idRavexTransportadora,
      nome: data.nome,
      cnpj: data.cnpj,
      status: data.status,
      quantidadeVeiculos: preview.quantidadeVeiculos,
      sincronizarPlacas,
    });
  });

  const voltarParaBusca = () => {
    if (isBusy) {
      return;
    }

    setStep('buscar');
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Cadastro rápido Ravex
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 'buscar'
              ? 'Informe a placa de um veículo da transportadora para buscar os dados na Ravex.'
              : 'Revise os dados importados da Ravex antes de confirmar o cadastro.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'buscar' ? (
          <form className="space-y-4" onSubmit={handleBuscar} noValidate>
            <div>
              <label
                htmlFor="cadastro-rapido-placa"
                className={fieldLabelClassName}
              >
                Placa do veículo{' '}
                <span className="text-destructive">*</span>
              </label>
              <input
                id="cadastro-rapido-placa"
                type="text"
                maxLength={8}
                className={cn(fieldInputClassName, 'font-mono uppercase')}
                placeholder="Ex: PPR6B82"
                aria-invalid={Boolean(buscaForm.formState.errors.placa)}
                {...buscaForm.register('placa', {
                  setValueAs: (value: string) => value.toUpperCase().trim(),
                })}
              />
              {buscaForm.formState.errors.placa?.message ? (
                <p className={fieldErrorClassName} role="alert">
                  {buscaForm.formState.errors.placa.message}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isBusy} className="gap-2">
                {isSearching ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Buscando…
                  </>
                ) : (
                  <>
                    <Search className="size-4" aria-hidden />
                    Buscar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleConfirmar} noValidate>
            {preview?.jaCadastrada ? (
              <div
                className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  Esta transportadora já está cadastrada nesta unidade. Confirme
                  apenas se deseja tentar um novo cadastro com o mesmo ID Ravex.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="cadastro-rapido-nome"
                  className={fieldLabelClassName}
                >
                  Nome <span className="text-destructive">*</span>
                </label>
                <input
                  id="cadastro-rapido-nome"
                  type="text"
                  className={fieldInputClassName}
                  aria-invalid={Boolean(confirmarForm.formState.errors.nome)}
                  {...confirmarForm.register('nome')}
                />
                {confirmarForm.formState.errors.nome?.message ? (
                  <p className={fieldErrorClassName} role="alert">
                    {confirmarForm.formState.errors.nome.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="cadastro-rapido-id-ravex-readonly"
                  className={fieldLabelClassName}
                >
                  ID Ravex
                </label>
                <input
                  id="cadastro-rapido-id-ravex-readonly"
                  type="text"
                  readOnly
                  className={cn(fieldInputClassName, 'font-mono opacity-70')}
                  value={preview?.idRavexTransportadora ?? ''}
                />
              </div>

              <div>
                <label
                  htmlFor="cadastro-rapido-veiculos"
                  className={fieldLabelClassName}
                >
                  Veículos na Ravex
                </label>
                <input
                  id="cadastro-rapido-veiculos"
                  type="text"
                  readOnly
                  className={cn(fieldInputClassName, 'opacity-70')}
                  value={preview?.quantidadeVeiculos ?? 0}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="cadastro-rapido-cnpj"
                  className={fieldLabelClassName}
                >
                  CNPJ <span className="text-destructive">*</span>
                </label>
                <input
                  id="cadastro-rapido-cnpj"
                  type="text"
                  inputMode="numeric"
                  className={cn(fieldInputClassName, 'font-mono')}
                  placeholder="00.000.000/0000-00"
                  aria-invalid={Boolean(confirmarForm.formState.errors.cnpj)}
                  {...confirmarForm.register('cnpj')}
                />
                {confirmarForm.formState.errors.cnpj?.message ? (
                  <p className={fieldErrorClassName} role="alert">
                    {confirmarForm.formState.errors.cnpj.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="cadastro-rapido-status"
                  className={fieldLabelClassName}
                >
                  Status
                </label>
                <Controller
                  control={confirmarForm.control}
                  name="status"
                  render={({ field }) => (
                    <select
                      id="cadastro-rapido-status"
                      className={fieldInputClassName}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      {Object.entries(TRANSPORTADORA_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="cadastro-rapido-sincronizar-placas"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/70 bg-muted/15 px-3 py-2.5"
                >
                  <input
                    id="cadastro-rapido-sincronizar-placas"
                    type="checkbox"
                    checked={sincronizarPlacas}
                    onChange={(event) =>
                      setSincronizarPlacas(event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">
                      Sincronizar placas automaticamente
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Importa todos os veículos da transportadora na Ravex após
                      o cadastro.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                className="gap-2"
                onClick={voltarParaBusca}
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isBusy || preview?.jaCadastrada}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Cadastrando…
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden />
                    Confirmar cadastro
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
