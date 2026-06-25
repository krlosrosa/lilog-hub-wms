'use client';

import { Button, cn } from '@lilog/ui';
import {
  Battery,
  CloudUpload,
  Download,
  Forklift,
  Info,
  Loader2,
  QrCode,
  Save,
  Settings2,
} from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  fieldSelectClassName,
  sectionCardClassName,
} from '@/features/equipamento/components/equipamento-form-field-classes';
import { useEquipamentoCadastro } from '@/features/equipamento/hooks/use-equipamento-cadastro';
import {
  AREA_OPERACAO_LABELS,
  CENTROS_DISTRIBUICAO_EQUIPAMENTO,
  SUPERVISORES_MOCK,
  TIPO_EQUIPAMENTO_LABELS,
  type AreaOperacao,
  type EquipamentoCadastroForm,
  type TipoEquipamento,
} from '@/features/equipamento/types/equipamento.schema';

const AREAS: AreaOperacao[] = [
  'recebimento',
  'armazenagem',
  'expedicao',
  'picking',
];

function SecaoIdentificacao({
  onBaixarEtiqueta,
}: {
  onBaixarEtiqueta: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<EquipamentoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <QrCode className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Identificação e patrimônio
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        <div>
          <label htmlFor="ean" className={fieldLabelClassName}>
            EAN / UPC
          </label>
          <input
            id="ean"
            {...register('ean')}
            placeholder="7891234567890"
            className={fieldInputClassName}
          />
          {errors.ean && (
            <p className={fieldErrorClassName}>{errors.ean.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="serialNumber" className={fieldLabelClassName}>
            Número de série
          </label>
          <input
            id="serialNumber"
            {...register('serialNumber')}
            placeholder="SN-2024-XXXX"
            className={fieldInputClassName}
          />
          {errors.serialNumber && (
            <p className={fieldErrorClassName}>
              {errors.serialNumber.message}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-dashed border-outline-variant bg-surface-low/50 p-8 sm:flex-row sm:justify-between">
        <div className="flex size-24 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
          <QrCode className="size-12" aria-hidden />
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={onBaixarEtiqueta}
        >
          <Download className="size-4" aria-hidden />
          Baixar etiqueta (PDF)
        </Button>
      </div>
    </section>
  );
}

function SecaoEspecificacoes() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EquipamentoCadastroForm>();

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Settings2 className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Especificações técnicas
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <div>
          <label htmlFor="tipo" className={fieldLabelClassName}>
            Tipo de equipamento
          </label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <select
                id="tipo"
                {...field}
                className={fieldSelectClassName}
              >
                {(Object.keys(TIPO_EQUIPAMENTO_LABELS) as TipoEquipamento[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {TIPO_EQUIPAMENTO_LABELS[t]}
                    </option>
                  ),
                )}
              </select>
            )}
          />
        </div>
        <div>
          <label htmlFor="marca" className={fieldLabelClassName}>
            Marca
          </label>
          <input
            id="marca"
            {...register('marca')}
            placeholder="Yale, Linde, Toyota…"
            className={fieldInputClassName}
          />
          {errors.marca && (
            <p className={fieldErrorClassName}>{errors.marca.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="modelo" className={fieldLabelClassName}>
            Modelo
          </label>
          <input
            id="modelo"
            {...register('modelo')}
            placeholder="ERP040VT"
            className={fieldInputClassName}
          />
          {errors.modelo && (
            <p className={fieldErrorClassName}>{errors.modelo.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="ano" className={fieldLabelClassName}>
            Ano
          </label>
          <input
            id="ano"
            type="number"
            {...register('ano', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.ano && (
            <p className={fieldErrorClassName}>{errors.ano.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="capacidadeKg" className={fieldLabelClassName}>
            Capacidade (kg)
          </label>
          <input
            id="capacidadeKg"
            type="number"
            {...register('capacidadeKg', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.capacidadeKg && (
            <p className={fieldErrorClassName}>
              {errors.capacidadeKg.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="elevacaoM" className={fieldLabelClassName}>
            Elevação (m)
          </label>
          <input
            id="elevacaoM"
            type="number"
            step="0.1"
            {...register('elevacaoM', { valueAsNumber: true })}
            className={fieldInputClassName}
          />
          {errors.elevacaoM && (
            <p className={fieldErrorClassName}>{errors.elevacaoM.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SecaoOperacao({
  imagemFileName,
  onImagemSelect,
  toggleArea,
}: {
  imagemFileName: string | null;
  onImagemSelect: (file: File | null) => void;
  toggleArea: (area: AreaOperacao) => void;
}) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<EquipamentoCadastroForm>();

  const areasSelecionadas = watch('areasOperacao');

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Info className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">Operação</h3>
      </div>
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <div>
          <label className={fieldLabelClassName}>Imagem do equipamento</label>
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-low/50 p-8 transition-colors hover:border-primary/50',
            )}
          >
            <CloudUpload className="size-8 text-muted-foreground" aria-hidden />
            <span className="text-body-md text-muted-foreground">
              {imagemFileName ?? 'Clique para enviar imagem'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) =>
                onImagemSelect(e.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="centroDistribuicao" className={fieldLabelClassName}>
              Centro de distribuição
            </label>
            <Controller
              name="centroDistribuicao"
              control={control}
              render={({ field }) => (
                <select
                  id="centroDistribuicao"
                  {...field}
                  className={fieldSelectClassName}
                >
                  {CENTROS_DISTRIBUICAO_EQUIPAMENTO.map((cd) => (
                    <option key={cd} value={cd}>
                      {cd}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <span className={fieldLabelClassName}>Área de operação</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={cn(
                    'rounded-md border px-4 py-2 text-label-md transition-colors',
                    areasSelecionadas.includes(area)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {AREA_OPERACAO_LABELS[area]}
                </button>
              ))}
            </div>
            {errors.areasOperacao && (
              <p className={fieldErrorClassName}>
                {errors.areasOperacao.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="supervisor" className={fieldLabelClassName}>
              Supervisor
            </label>
            <Controller
              name="supervisor"
              control={control}
              render={({ field }) => (
                <select
                  id="supervisor"
                  {...field}
                  className={fieldSelectClassName}
                >
                  {SUPERVISORES_MOCK.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoEletrico() {
  const { register, watch } = useFormContext<EquipamentoCadastroForm>();
  const usaBateria = watch('usaBateria');

  return (
    <section className={sectionCardClassName}>
      <div className="mb-8 flex items-center gap-3 border-b border-outline-variant/30 pb-4">
        <Battery className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="text-title-md font-medium text-foreground">
          Sistema elétrico
        </h3>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <input
          id="usaBateria"
          type="checkbox"
          {...register('usaBateria')}
          className="size-4 rounded border-outline-variant text-primary focus:ring-ring"
        />
        <label htmlFor="usaBateria" className="text-body-md text-foreground">
          Equipamento utiliza bateria tracionária
        </label>
      </div>
      {usaBateria ? (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <div>
            <label htmlFor="tipoBateria" className={fieldLabelClassName}>
              Tipo de bateria
            </label>
            <input
              id="tipoBateria"
              {...register('tipoBateria')}
              className={fieldInputClassName}
            />
          </div>
          <div>
            <label htmlFor="voltagem" className={fieldLabelClassName}>
              Voltagem
            </label>
            <input
              id="voltagem"
              {...register('voltagem')}
              placeholder="48V"
              className={fieldInputClassName}
            />
          </div>
          <div>
            <label htmlFor="amperagem" className={fieldLabelClassName}>
              Amperagem
            </label>
            <input
              id="amperagem"
              {...register('amperagem')}
              placeholder="625Ah"
              className={fieldInputClassName}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function EquipamentoCadastroView() {
  const {
    form,
    isSubmitting,
    imagemFileName,
    onSubmit,
    cancelar,
    toggleArea,
    onImagemSelect,
    baixarEtiqueta,
  } = useEquipamentoCadastro();

  return (
    <SidebarMain className="blueprint-grid">
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-4 border-l-4 border-primary pl-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Forklift className="size-5 text-primary" aria-hidden />
                <span className="text-caption font-bold uppercase tracking-widest text-primary">
                  Cadastro
                </span>
              </div>
              <h1 className="text-headline-lg font-semibold tracking-tight text-foreground">
                Novo equipamento
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Registre empilhadeiras, transpaleteiras e demais ativos do CD.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={cancelar}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="equipamento-cadastro-form"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                Salvar equipamento
              </Button>
            </div>
          </div>

          <FormProvider {...form}>
            <form
              id="equipamento-cadastro-form"
              onSubmit={(e) => void onSubmit(e)}
              className="space-y-6"
            >
              <SecaoIdentificacao onBaixarEtiqueta={baixarEtiqueta} />
              <SecaoEspecificacoes />
              <SecaoOperacao
                imagemFileName={imagemFileName}
                onImagemSelect={onImagemSelect}
                toggleArea={toggleArea}
              />
              <SecaoEletrico />
            </form>
          </FormProvider>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-outline-variant bg-glass-bg px-6 py-4 text-caption text-muted-foreground">
            <span>Vida útil estimada: 12.000 h</span>
            <span>Garantia padrão: 24 meses</span>
            <span className="text-primary">Validação automática ao salvar</span>
          </footer>
        </div>
      </main>
    </SidebarMain>
  );
}
