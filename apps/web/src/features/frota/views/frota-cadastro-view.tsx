'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  CloudUpload,
  Info,
  Loader2,
  Save,
  Settings2,
  FileText,
  Network,
} from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  fieldSelectClassName,
  sectionCardClassName,
} from '@/features/frota/components/frota-form-field-classes';
import { useFrotaCadastro } from '@/features/frota/hooks/use-frota-cadastro';
import {
  CENTROS_DISTRIBUICAO_MOCK,
  TIPO_VEICULO_LABELS,
  TRANSPORTADORAS_MOCK,
  type TipoVeiculo,
  type VeiculoCadastroForm,
} from '@/features/frota/types/frota.schema';

function SecaoGeral() {
  const {
    register,
    formState: { errors },
  } = useFormContext<VeiculoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Info className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Informações gerais
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <div>
          <label htmlFor="placa" className={fieldLabelClassName}>
            Placa
          </label>
          <input
            id="placa"
            {...register('placa')}
            placeholder="ABC-1234"
            className={fieldInputClassName}
          />
          {errors.placa && (
            <p className={fieldErrorClassName}>{errors.placa.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="renavam" className={fieldLabelClassName}>
            Renavam
          </label>
          <input
            id="renavam"
            {...register('renavam')}
            placeholder="00000000000"
            className={fieldInputClassName}
          />
          {errors.renavam && (
            <p className={fieldErrorClassName}>{errors.renavam.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="chassis" className={fieldLabelClassName}>
            Chassi
          </label>
          <input
            id="chassis"
            {...register('chassis')}
            placeholder="Número do chassi"
            className={fieldInputClassName}
          />
          {errors.chassis && (
            <p className={fieldErrorClassName}>{errors.chassis.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="marcaModelo" className={fieldLabelClassName}>
            Marca / Modelo
          </label>
          <input
            id="marcaModelo"
            {...register('marcaModelo')}
            placeholder="Ex: Volvo FH 540"
            className={fieldInputClassName}
          />
          {errors.marcaModelo && (
            <p className={fieldErrorClassName}>
              {errors.marcaModelo.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="anoFabricacao" className={fieldLabelClassName}>
            Ano fabricação
          </label>
          <input
            id="anoFabricacao"
            type="number"
            {...register('anoFabricacao', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.anoFabricacao && (
            <p className={fieldErrorClassName}>
              {errors.anoFabricacao.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="anoModelo" className={fieldLabelClassName}>
            Ano modelo
          </label>
          <input
            id="anoModelo"
            type="number"
            {...register('anoModelo', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.anoModelo && (
            <p className={fieldErrorClassName}>{errors.anoModelo.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SecaoTecnica() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<VeiculoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Settings2 className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Especificações técnicas
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="tipoVeiculo" className={fieldLabelClassName}>
            Tipo de veículo
          </label>
          <Controller
            name="tipoVeiculo"
            control={control}
            render={({ field }) => (
              <select
                id="tipoVeiculo"
                {...field}
                className={fieldSelectClassName}
              >
                {(Object.keys(TIPO_VEICULO_LABELS) as TipoVeiculo[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {TIPO_VEICULO_LABELS[key]}
                    </option>
                  ),
                )}
              </select>
            )}
          />
        </div>
        <div>
          <label htmlFor="pesoBrutoKg" className={fieldLabelClassName}>
            Peso bruto (PBT)
          </label>
          <div className="relative">
            <input
              id="pesoBrutoKg"
              type="number"
              step="0.01"
              {...register('pesoBrutoKg', { valueAsNumber: true })}
              className={fieldInputClassName}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
              KG
            </span>
          </div>
          {errors.pesoBrutoKg && (
            <p className={fieldErrorClassName}>{errors.pesoBrutoKg.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="pesoLiquidoKg" className={fieldLabelClassName}>
            Peso líquido
          </label>
          <div className="relative">
            <input
              id="pesoLiquidoKg"
              type="number"
              step="0.01"
              {...register('pesoLiquidoKg', { valueAsNumber: true })}
              className={fieldInputClassName}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
              KG
            </span>
          </div>
          {errors.pesoLiquidoKg && (
            <p className={fieldErrorClassName}>
              {errors.pesoLiquidoKg.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="cubagemM3" className={fieldLabelClassName}>
            Cubagem
          </label>
          <div className="relative">
            <input
              id="cubagemM3"
              type="number"
              step="0.01"
              {...register('cubagemM3', { valueAsNumber: true })}
              className={fieldInputClassName}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
              M³
            </span>
          </div>
          {errors.cubagemM3 && (
            <p className={fieldErrorClassName}>{errors.cubagemM3.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="capacidadePaletes" className={fieldLabelClassName}>
            Capacidade de paletes
          </label>
          <input
            id="capacidadePaletes"
            type="number"
            {...register('capacidadePaletes', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.capacidadePaletes && (
            <p className={fieldErrorClassName}>
              {errors.capacidadePaletes.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type SecaoDocumentacaoProps = {
  crlvFileName: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (file: File | null) => void;
};

function SecaoDocumentacao({
  crlvFileName,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
}: SecaoDocumentacaoProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<VeiculoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <FileText className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Documentação
        </h3>
      </div>
      <div className="space-y-6">
        <div
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-lowest p-6 transition-colors',
            isDragging && 'border-primary bg-muted/30',
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById('crlv-upload')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              document.getElementById('crlv-upload')?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            id="crlv-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <CloudUpload className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-label-sm text-muted-foreground">
            {crlvFileName ?? 'Upload de CRLV digital (PDF/JPG)'}
          </p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            Limite: 10MB
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="vencimentoSeguro" className={fieldLabelClassName}>
              Vencimento seguro
            </label>
            <input
              id="vencimentoSeguro"
              type="date"
              {...register('vencimentoSeguro')}
              className={fieldInputClassName}
            />
            {errors.vencimentoSeguro && (
              <p className={fieldErrorClassName}>
                {errors.vencimentoSeguro.message}
              </p>
            )}
          </div>
          <div>
            <span className={fieldLabelClassName}>Status ANTT</span>
            <div className="flex h-12 items-center gap-2 rounded border border-outline-variant bg-surface-lowest px-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-active" />
              <span className="text-label-sm text-foreground">
                Regularizado
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoAlocacao() {
  const {
    register,
    formState: { errors },
  } = useFormContext<VeiculoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Network className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Alocação e propriedade
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="transportadora" className={fieldLabelClassName}>
            Transportadora parceira
          </label>
          <select
            id="transportadora"
            {...register('transportadora')}
            className={fieldSelectClassName}
          >
            {TRANSPORTADORAS_MOCK.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="centroDistribuicao" className={fieldLabelClassName}>
            Centro de distribuição
          </label>
          <select
            id="centroDistribuicao"
            {...register('centroDistribuicao')}
            className={fieldSelectClassName}
          >
            {CENTROS_DISTRIBUICAO_MOCK.map((cd) => (
              <option key={cd} value={cd}>
                {cd}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="proprietario" className={fieldLabelClassName}>
            Proprietário (nome/razão social)
          </label>
          <input
            id="proprietario"
            {...register('proprietario')}
            placeholder="Nome completo ou razão social"
            className={fieldInputClassName}
          />
          {errors.proprietario && (
            <p className={fieldErrorClassName}>
              {errors.proprietario.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function FrotaCadastroView() {
  const {
    form,
    isSubmitting,
    crlvFileName,
    isDraggingCrlv,
    onSubmit,
    cancelar,
    onCrlvSelect,
    onCrlvDragOver,
    onCrlvDragLeave,
    onCrlvDrop,
  } = useFrotaCadastro();

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col blueprint-grid">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex items-center gap-2 text-label-md"
          >
            <Link
              href="/frota"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Frota
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Novo veículo</span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" onClick={cancelar}>
              Descartar
            </Button>
            <Button
              type="submit"
              form="frota-cadastro-form"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Salvar registro
            </Button>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <p className="mb-2 text-label-sm uppercase tracking-widest text-primary">
                Módulo de frota
              </p>
              <h2 className="text-headline-lg font-semibold text-foreground">
                Cadastro de novo veículo
              </h2>
              <p className="mt-2 text-body-md text-muted-foreground">
                Insira os dados técnicos e documentais para habilitar o veículo
                na malha logística.
              </p>
            </div>

            <form
              id="frota-cadastro-form"
              className="space-y-8"
              onSubmit={onSubmit}
            >
              <SecaoGeral />
              <SecaoTecnica />
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <SecaoDocumentacao
                  crlvFileName={crlvFileName}
                  isDragging={isDraggingCrlv}
                  onDragOver={onCrlvDragOver}
                  onDragLeave={onCrlvDragLeave}
                  onDrop={onCrlvDrop}
                  onFileChange={onCrlvSelect}
                />
                <SecaoAlocacao />
              </div>
            </form>
          </div>
        </main>
      </SidebarMain>
    </FormProvider>
  );
}
