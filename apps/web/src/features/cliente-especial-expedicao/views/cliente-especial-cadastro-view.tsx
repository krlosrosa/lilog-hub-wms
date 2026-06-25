'use client';

import Link from 'next/link';
import { useFormContext } from 'react-hook-form';

import { Button, cn } from '@lilog/ui';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { ClienteEspecialBadge } from '@/features/cliente-especial-expedicao/components/cliente-especial-badge';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  fieldTextareaClassName,
  sectionCardClassName,
} from '@/features/cliente-especial-expedicao/components/form-field-classes';
import { useClienteEspecialForm } from '@/features/cliente-especial-expedicao/hooks/use-cliente-especial-form';
import type { ClienteEspecialFormValues } from '@/features/cliente-especial-expedicao/types/cliente-especial.schema';

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-outline-variant text-primary focus:ring-ring"
      />
    </div>
  );
}

function ClienteEspecialFormFields() {
  const form = useFormContext<ClienteEspecialFormValues>();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const flags = watch([
    'exigeSegregacaoMapa',
    'exigeSeparacaoEspecial',
    'exigeCarregamentoEspecial',
    'ativo',
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className={sectionCardClassName}>
        <h3 className="mb-2 text-headline-md font-semibold text-foreground">
          Identificação
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Informe o código clifor e o nome do cliente conforme aparecem nas remessas.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="codCliente" className={fieldLabelClassName}>
              Código do cliente (clifor)
            </label>
            <input
              id="codCliente"
              className={fieldInputClassName}
              placeholder="Ex.: 0001234567"
              {...register('codCliente')}
            />
            {errors.codCliente ? (
              <p className={fieldErrorClassName}>{errors.codCliente.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="nomeCliente" className={fieldLabelClassName}>
              Nome do cliente
            </label>
            <input
              id="nomeCliente"
              className={fieldInputClassName}
              placeholder="Ex.: Supermercado Central"
              {...register('nomeCliente')}
            />
            {errors.nomeCliente ? (
              <p className={fieldErrorClassName}>{errors.nomeCliente.message}</p>
            ) : null}
          </div>

          <ToggleField
            id="ativo"
            label="Cadastro ativo"
            description="Clientes inativos não geram alertas nos transportes."
            checked={flags[3]}
            onChange={(checked) =>
              setValue('ativo', checked, { shouldDirty: true })
            }
          />
        </div>
      </section>

      <section className={sectionCardClassName}>
        <h3 className="mb-2 text-headline-md font-semibold text-foreground">
          Regras operacionais
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Defina quais processos devem tratar este cliente de forma diferenciada.
        </p>

        <div className="space-y-4">
          <ToggleField
            id="exigeSeparacaoEspecial"
            label="Separação especial"
            description="Exibe observações no mapa de separação."
            checked={flags[1]}
            onChange={(checked) =>
              setValue('exigeSeparacaoEspecial', checked, { shouldDirty: true })
            }
          />
          <ToggleField
            id="exigeCarregamentoEspecial"
            label="Carregamento especial"
            description="Exibe observações no carregamento."
            checked={flags[2]}
            onChange={(checked) =>
              setValue('exigeCarregamentoEspecial', checked, { shouldDirty: true })
            }
          />
          <ToggleField
            id="exigeSegregacaoMapa"
            label="Segregar no mapa"
            description="Gera bloco separado automaticamente na expedição."
            checked={flags[0]}
            onChange={(checked) =>
              setValue('exigeSegregacaoMapa', checked, { shouldDirty: true })
            }
          />
        </div>
      </section>

      <section className={cn(sectionCardClassName, 'lg:col-span-2')}>
        <h3 className="mb-2 text-headline-md font-semibold text-foreground">
          Observações
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Estas informações aparecem nos mapas impressos e alertam a equipe operacional.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="observacaoGeral" className={fieldLabelClassName}>
              Observação geral
            </label>
            <textarea
              id="observacaoGeral"
              className={fieldTextareaClassName}
              placeholder="Instruções gerais sobre o cliente..."
              {...register('observacaoGeral')}
            />
          </div>
          <div>
            <label htmlFor="observacaoSeparacao" className={fieldLabelClassName}>
              Observação de separação
            </label>
            <textarea
              id="observacaoSeparacao"
              className={fieldTextareaClassName}
              placeholder="Ex.: Separar em pallet exclusivo..."
              {...register('observacaoSeparacao')}
            />
          </div>
          <div>
            <label htmlFor="observacaoCarregamento" className={fieldLabelClassName}>
              Observação de carregamento
            </label>
            <textarea
              id="observacaoCarregamento"
              className={fieldTextareaClassName}
              placeholder="Ex.: Carregar por último, lado direito..."
              {...register('observacaoCarregamento')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type ClienteEspecialCadastroViewProps = {
  clienteId?: string;
};

export function ClienteEspecialCadastroView({
  clienteId,
}: ClienteEspecialCadastroViewProps) {
  const {
    form,
    isEditMode,
    isLoading,
    isSubmitting,
    unidadeSelecionada,
    onSubmit,
    cancelar,
  } = useClienteEspecialForm({ clienteId });

  const codCliente = form.watch('codCliente');
  const nomeCliente = form.watch('nomeCliente');

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex items-center gap-2 text-label-md"
          >
            <Link
              href="/expedicao/clientes-especiais"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Clientes Especiais
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">
              {isEditMode ? 'Editar' : 'Novo'}
            </span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" onClick={cancelar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cliente-especial-form"
              disabled={isSubmitting || isLoading || !unidadeSelecionada}
              className="min-w-[9rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : isEditMode ? (
                'Salvar alterações'
              ) : (
                'Cadastrar'
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-surface-lowest px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Carregando cadastro...
            </div>
          ) : (
            <form
              id="cliente-especial-form"
              className="mx-auto max-w-container space-y-8"
              onSubmit={onSubmit}
              noValidate
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-headline-lg-mobile font-bold tracking-tight text-foreground md:text-headline-lg">
                    {isEditMode ? 'Editar cliente especial' : 'Cadastrar cliente especial'}
                  </h1>
                  <p className="mt-2 max-w-2xl text-body-md text-muted-foreground">
                    Unidade:{' '}
                    <span className="font-semibold text-foreground">
                      {unidadeSelecionada?.nomeFilial ?? 'não selecionada'}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 md:min-w-[280px]">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600" aria-hidden />
                    <ClienteEspecialBadge />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {codCliente.trim() || nomeCliente.trim()
                      ? `${codCliente.trim() || '—'} · ${nomeCliente.trim() || 'Novo cliente'}`
                      : 'Pré-visualização do cadastro'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Alertas automáticos em transportes que incluírem este clifor.
                  </p>
                </div>
              </div>

              <ClienteEspecialFormFields />
            </form>
          )}
        </main>
      </SidebarMain>
    </FormProvider>
  );
}
