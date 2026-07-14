'use client';

import Link from 'next/link';

import {
  Briefcase,
  ChevronRight,
  Info,
  KeyRound,
  Loader2,
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
} from '@/features/pessoas/components/pessoa-form-field-classes';
import { usePessoasCadastro } from '@/features/pessoas/hooks/use-pessoas-cadastro';
import {
  CARGO_OPTIONS,
  PERFIL_OPTIONS,
  type PessoaFormValues,
} from '@/features/pessoas/types/pessoa.schema';

function OperacionalSection({ isEditMode }: { isEditMode: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PessoaFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <User className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">Dados Operacionais</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            Este ID será usado no login quando houver acesso ao sistema.
          </p>
        </div>
        <div>
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
            <p className={fieldErrorClassName}>{errors.dataAdmissao.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EquipeUnidadeSection({
  equipesOpcoes,
  unidadesOpcoes,
}: {
  equipesOpcoes: Array<{ id: string; nome: string; area: string | null }>;
  unidadesOpcoes: Array<{ id: string; nome: string; nomeFilial: string }>;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PessoaFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-2">
        <Briefcase className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-bold text-foreground">
          Departamento e Unidade
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="equipeId" className={fieldLabelClassName}>
            Departamento (Equipe)
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
                : 'Selecionar departamento'}
            </option>
            {equipesOpcoes.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nome}
                {equipe.area ? ` — ${equipe.area}` : ''}
              </option>
            ))}
          </select>
          {errors.equipeId && (
            <p className={fieldErrorClassName}>{errors.equipeId.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="unidadeId" className={fieldLabelClassName}>
            Unidade Operacional
          </label>
          <select
            id="unidadeId"
            {...register('unidadeId')}
            className={fieldInputClassName}
            disabled={unidadesOpcoes.length === 0}
          >
            <option value="">Selecionar unidade</option>
            {unidadesOpcoes.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome} — {unidade.nomeFilial}
              </option>
            ))}
          </select>
          {errors.unidadeId && (
            <p className={fieldErrorClassName}>{errors.unidadeId.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AcessoSection({
  isEditMode,
  userIdExistente,
}: {
  isEditMode: boolean;
  userIdExistente: number | null;
}) {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext<PessoaFormValues>();
  const concederAcesso = watch('concederAcesso');
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
          {...register('concederAcesso')}
          className="mt-0.5 size-5 rounded border-outline-variant bg-surface-low text-primary focus:ring-ring"
        />
        <div>
          <p className="text-body-md font-semibold text-foreground">
            Habilitar acesso ao sistema
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Cria credenciais de login vinculadas a esta pessoa. O ID de login
            será a matrícula informada.
          </p>
        </div>
      </label>

      {concederAcesso && (
        <div className="mt-6 space-y-6">
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
          </div>

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <span className={fieldLabelClassName}>Perfil de acesso</span>
                {PERFIL_OPTIONS.map((opcao) => (
                  <label
                    key={opcao.value}
                    className={cn(
                      'flex cursor-pointer items-center rounded-lg border border-transparent bg-surface-high p-4 transition-all hover:border-tertiary',
                      field.value === opcao.value && 'border-tertiary',
                    )}
                  >
                    <input
                      type="radio"
                      value={opcao.value}
                      checked={field.value === opcao.value}
                      onChange={() => field.onChange(opcao.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'mr-4 flex size-5 items-center justify-center rounded-full border-2 border-outline-variant',
                        field.value === opcao.value && 'border-tertiary',
                      )}
                    >
                      {field.value === opcao.value && (
                        <div className="size-2.5 rounded-full bg-tertiary" />
                      )}
                    </div>
                    <div>
                      <span className="block text-label-md text-foreground">
                        {opcao.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {opcao.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="email" className={fieldLabelClassName}>
                E-mail{' '}
                <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Opcional — login é feito pelo ID"
                className={fieldInputClassName}
              />
              {errors.email && (
                <p className={fieldErrorClassName}>{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="senha" className={fieldLabelClassName}>
                {isEditMode && userIdExistente
                  ? 'Nova senha (opcional)'
                  : 'Senha inicial'}
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="senha"
                  type="password"
                  {...register('senha')}
                  placeholder={
                    isEditMode && userIdExistente
                      ? 'Deixe em branco para manter'
                      : 'Mínimo 6 caracteres'
                  }
                  className={cn(fieldInputClassName, 'pl-10')}
                />
              </div>
              {errors.senha && (
                <p className={fieldErrorClassName}>{errors.senha.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBanner() {
  const concederAcesso = useFormContext<PessoaFormValues>().watch('concederAcesso');
  const matricula = useFormContext<PessoaFormValues>().watch('matricula');

  return (
    <div className="mb-8 flex items-start gap-4 rounded-lg border-l-4 border-accent bg-surface-low p-4">
      <Info className="size-6 shrink-0 text-accent" aria-hidden />
      <div>
        <p className="text-body-md font-semibold text-foreground">
          {concederAcesso ? 'Cadastro com acesso' : 'Cadastro operacional'}
        </p>
        <p className="text-label-md text-muted-foreground">
          {concederAcesso
            ? `Login ID ${matricula || '—'} — acesso ativo imediatamente após salvar.`
            : 'Pessoa registrada apenas para fins operacionais, sem credenciais de login.'}
        </p>
      </div>
    </div>
  );
}

export function PessoasCadastroView() {
  const {
    form,
    isEditMode,
    isSubmitting,
    isLoading,
    unidadesOpcoes,
    equipesOpcoes,
    userIdExistente,
    onSubmit,
    cancelar,
  } = usePessoasCadastro();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-label-md text-muted-foreground"
          >
            <Link
              href="/pessoas"
              className="transition-colors hover:text-primary"
            >
              Pessoas
            </Link>
            <ChevronRight className="size-4" aria-hidden />
            <span className="text-foreground">
              {isEditMode ? 'Editar Pessoa' : 'Nova Pessoa'}
            </span>
          </nav>

          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : (
            <FormProvider {...form}>
              <InfoBanner />
              <form onSubmit={onSubmit} className="space-y-gutter pb-24">
                <OperacionalSection isEditMode={isEditMode} />
                <EquipeUnidadeSection
                  equipesOpcoes={equipesOpcoes}
                  unidadesOpcoes={unidadesOpcoes}
                />
                <AcessoSection
                  isEditMode={isEditMode}
                  userIdExistente={userIdExistente}
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
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-5" aria-hidden />
                    )}
                    Salvar Pessoa
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}
