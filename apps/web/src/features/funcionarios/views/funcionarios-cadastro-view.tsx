'use client';

import Link from 'next/link';

import {
  Camera,
  ChevronRight,
  Info,
  KeyRound,
  Loader2,
  MapPin,
  Briefcase,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/funcionarios/components/funcionario-form-field-classes';
import { useFuncionariosCadastro } from '@/features/funcionarios/hooks/use-funcionarios-cadastro';
import {
  CARGO_OPTIONS,
  TURNO_OPTIONS,
  type FuncionarioFormValues,
} from '@/features/funcionarios/types/funcionarios-cadastro.schema';

function PhotoSection() {
  return (
    <div
      className={cn(
        sectionCardClassName,
        'flex flex-col items-center justify-center gap-6',
      )}
    >
      <div className="group relative cursor-pointer">
        <div className="flex size-32 items-center justify-center rounded-full border-2 border-dashed border-outline-variant bg-surface-highest transition-all group-hover:border-primary">
          <Camera className="size-10 text-muted-foreground" aria-hidden />
        </div>
        <div className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Camera className="size-[18px]" aria-hidden />
        </div>
      </div>
      <div className="text-center">
        <p className="text-label-md font-bold text-foreground">Foto do Perfil</p>
        <p className="mt-1 text-caption text-muted-foreground">
          JPG, PNG (Máx 2MB)
        </p>
      </div>
    </div>
  );
}

function PersonalInfoSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FuncionarioFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <User className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">
          Informações Pessoais
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="nomeCompleto" className={fieldLabelClassName}>
            Nome Completo
          </label>
          <input
            id="nomeCompleto"
            {...register('nomeCompleto')}
            placeholder="Ex: João da Silva"
            className={fieldInputClassName}
          />
          {errors.nomeCompleto && (
            <p className={fieldErrorClassName}>{errors.nomeCompleto.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfessionalInfoSection({
  isEditMode,
  equipesOpcoes,
}: {
  isEditMode: boolean;
  equipesOpcoes: Array<{ id: string; nome: string; area: string | null }>;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FuncionarioFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <Briefcase className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">
          Informações Profissionais
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="matricula" className={fieldLabelClassName}>
            Matrícula / ID
          </label>
          <input
            id="matricula"
            type="text"
            inputMode="numeric"
            disabled={isEditMode}
            {...register('matricula')}
            placeholder="Ex: 421931"
            className={cn(
              fieldInputClassName,
              'font-mono',
              isEditMode && 'cursor-not-allowed opacity-70',
            )}
          />
          {errors.matricula && (
            <p className={fieldErrorClassName}>{errors.matricula.message}</p>
          )}
          <p className="mt-1 text-caption text-muted-foreground">
            ID numérico definido por você. Não use UUID.
          </p>
        </div>
        <div>
          <label htmlFor="cargo" className={fieldLabelClassName}>
            Cargo
          </label>
          <select
            id="cargo"
            {...register('cargo')}
            className={fieldInputClassName}
          >
            {CARGO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.cargo && (
            <p className={fieldErrorClassName}>{errors.cargo.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="equipeId" className={fieldLabelClassName}>
            Departamento
          </label>
          <select
            id="equipeId"
            {...register('equipeId')}
            className={fieldInputClassName}
            disabled={equipesOpcoes.length === 0}
          >
            <option value="">
              {equipesOpcoes.length === 0
                ? 'Nenhuma equipe cadastrada nesta unidade'
                : 'Selecionar Departamento'}
            </option>
            {equipesOpcoes.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nome}
                {equipe.area ? ` — ${equipe.area}` : ''}
              </option>
            ))}
          </select>
          {errors.equipeId && (
            <p className={fieldErrorClassName}>
              {errors.equipeId.message}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <span className={fieldLabelClassName}>Turno de Trabalho</span>
          <Controller
            name="turno"
            control={control}
            render={({ field }) => (
              <div className="mt-2 flex gap-2">
                {TURNO_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="relative flex-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      className="peer sr-only"
                      value={opt.value}
                      checked={field.value === opt.value}
                      onChange={() => field.onChange(opt.value)}
                    />
                    <div
                      className={cn(
                        'flex h-11 items-center justify-center rounded border border-outline-variant transition-all',
                        'peer-checked:border-secondary peer-checked:bg-secondary-container',
                      )}
                    >
                      <span className="text-label-md">{opt.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.turno && (
            <p className={fieldErrorClassName}>{errors.turno.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="dataAdmissao" className={fieldLabelClassName}>
            Data de Admissão
          </label>
          <input
            id="dataAdmissao"
            type="date"
            {...register('dataAdmissao')}
            className={fieldInputClassName}
          />
          {errors.dataAdmissao && (
            <p className={fieldErrorClassName}>
              {errors.dataAdmissao.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UsuarioAdminSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<FuncionarioFormValues>();
  const criarUsuarioAdmin = watch('criarUsuarioAdmin');
  const matricula = watch('matricula');

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">Acesso ao Sistema</h2>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant bg-surface-high p-4 transition-colors hover:border-primary">
        <input
          type="checkbox"
          {...register('criarUsuarioAdmin')}
          className="mt-0.5 size-5 rounded border-outline-variant bg-surface-low text-primary focus:ring-ring"
        />
        <div>
          <p className="text-body-md font-semibold text-foreground">
            Também criar como Administrador do Sistema
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Cadastra o funcionário e, na mesma operação, cria o usuário com
            perfil admin e acesso imediato ao sistema.
          </p>
        </div>
      </label>

      {criarUsuarioAdmin && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="loginIdPreview" className={fieldLabelClassName}>
              ID de Login
            </label>
            <input
              id="loginIdPreview"
              type="text"
              readOnly
              value={matricula || '—'}
              className={cn(
                fieldInputClassName,
                'cursor-not-allowed font-mono opacity-80',
              )}
            />
            <p className="mt-1 text-caption text-muted-foreground">
              O ID de acesso será o mesmo da matrícula.
            </p>
          </div>
          <div>
            <label htmlFor="usuarioEmail" className={fieldLabelClassName}>
              E-mail <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="usuarioEmail"
              type="email"
              {...register('usuarioEmail')}
              placeholder="Opcional — login é feito pelo ID"
              className={fieldInputClassName}
            />
            {errors.usuarioEmail && (
              <p className={fieldErrorClassName}>
                {errors.usuarioEmail.message}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="usuarioSenha" className={fieldLabelClassName}>
              Senha Inicial
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="usuarioSenha"
                type="password"
                {...register('usuarioSenha')}
                placeholder="Mínimo 6 caracteres"
                className={cn(fieldInputClassName, 'pl-10')}
              />
            </div>
            {errors.usuarioSenha && (
              <p className={fieldErrorClassName}>
                {errors.usuarioSenha.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlocacaoSection({
  unidadesOpcoes,
  onToggleUnidade,
}: {
  unidadesOpcoes: Array<{ id: string; nome: string; nomeFilial: string }>;
  onToggleUnidade: (id: string) => void;
}) {
  const { watch, formState: { errors } } =
    useFormContext<FuncionarioFormValues>();
  const unidadesIds = watch('unidadesIds');

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <MapPin className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">
          Alocação e Unidades
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-label-md text-muted-foreground">
            Selecione a Unidade Operacional / Centro de Distribuição:
          </p>
          <div className="space-y-3">
            {unidadesOpcoes.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                Nenhuma unidade cadastrada no sistema.
              </p>
            ) : (
              unidadesOpcoes.map((unidade) => (
                <label
                  key={unidade.id}
                  className="flex cursor-pointer items-center gap-3 rounded border border-outline-variant bg-surface-high p-3 transition-colors hover:border-primary"
                >
                  <input
                    type="checkbox"
                    checked={unidadesIds.includes(unidade.id)}
                    onChange={() => onToggleUnidade(unidade.id)}
                    className="size-5 rounded border-outline-variant bg-surface-low text-primary focus:ring-ring"
                  />
                  <div>
                    <p className="text-body-md font-semibold leading-none text-foreground">
                      {unidade.nome}
                    </p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {unidade.nomeFilial}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                      {unidade.id}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
          {errors.unidadesIds && (
            <p className={fieldErrorClassName}>{errors.unidadesIds.message}</p>
          )}
        </div>
        <div className="relative min-h-[160px] overflow-hidden rounded-lg border border-outline-variant">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative flex h-full min-h-[160px] flex-col justify-end p-4">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-5" aria-hidden />
              <span className="text-label-md font-bold uppercase tracking-widest">
                Mapa Logístico
              </span>
            </div>
            <p className="mt-2 text-caption text-muted-foreground">
              Visualização das unidades selecionadas no mapa operacional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBanner() {
  const criarUsuarioAdmin = useFormContext<FuncionarioFormValues>().watch(
    'criarUsuarioAdmin',
  );

  return (
    <div className="mb-10 flex items-start gap-4 rounded-lg border-l-4 border-accent bg-surface-low p-4">
      <Info className="size-6 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-body-md font-semibold text-foreground">
          {criarUsuarioAdmin ? 'Cadastro Completo' : 'Nota Importante'}
        </p>
        <p className="text-label-md text-muted-foreground">
          {criarUsuarioAdmin
            ? 'Serão criados o funcionário e o usuário administrador em uma única operação. O ID de login será a matrícula informada.'
            : 'Este colaborador não possui credenciais de login. O cadastro é destinado exclusivamente para fins operacionais e de produtividade.'}
        </p>
      </div>
    </div>
  );
}

export function FuncionariosCadastroView() {
  const {
    form,
    isEditMode,
    isSubmitting,
    isLoading,
    unidadesOpcoes,
    equipesOpcoes,
    onSubmit,
    cancelar,
    toggleUnidade,
  } = useFuncionariosCadastro();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-label-md text-muted-foreground"
          >
            <Link
              href="/funcionarios"
              className="transition-colors hover:text-primary"
            >
              Diretório
            </Link>
            <ChevronRight className="size-4" aria-hidden />
            <span className="text-foreground">Novo Funcionário</span>
          </nav>

          <FormProvider {...form}>
            <InfoBanner />

            <form onSubmit={onSubmit} className="space-y-gutter pb-24">
              <div className="grid grid-cols-12 gap-gutter">
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                  <PhotoSection />
                </div>
                <div className="col-span-12 md:col-span-8 lg:col-span-9">
                  <PersonalInfoSection />
                </div>
              </div>

              <ProfessionalInfoSection
                isEditMode={isEditMode}
                equipesOpcoes={equipesOpcoes}
              />
              {!isEditMode && <UsuarioAdminSection />}
              <AlocacaoSection
                unidadesOpcoes={unidadesOpcoes}
                onToggleUnidade={toggleUnidade}
              />

              <div className="flex items-center justify-end gap-4 border-t border-outline-variant pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelar}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-5" aria-hidden />
                  )}
                  {form.watch('criarUsuarioAdmin') && !isEditMode
                    ? 'Salvar e Criar Admin'
                    : 'Salvar Funcionário'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </main>
    </SidebarMain>
  );
}
