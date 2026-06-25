'use client';

import Link from 'next/link';

import { Badge, Key, Loader2, MapPin, Trash2, User } from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import type { UnidadeApi } from '@/features/filiais/types/unidade.api';
import type { FuncionarioApi } from '@/features/funcionarios/types/funcionario.api';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/usuarios/components/usuario-form-field-classes';
import { useUsuariosCadastro } from '@/features/usuarios/hooks/use-usuarios-cadastro';
import {
  CARGO_OPTIONS,
  DEPARTAMENTO_OPTIONS,
  PERFIL_CADASTRO_OPTIONS,
  UNIDADE_ACESSO_LABELS,
  type UnidadeAcessoNivel,
  type UsuarioFormValues,
} from '@/features/usuarios/types/usuarios-cadastro.schema';

function PersonalInfoSection({ isEditMode }: { isEditMode: boolean }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<UsuarioFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-surface-highest text-primary">
          <User className="size-5" aria-hidden />
        </div>
        <h2 className="text-xl font-medium text-foreground">Informações Pessoais</h2>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="loginId" className={fieldLabelClassName}>
            ID de acesso
          </label>
          <input
            id="loginId"
            type="text"
            inputMode="numeric"
            disabled={isEditMode}
            {...register('loginId')}
            placeholder="Ex: 421931"
            className={cn(fieldInputClassName, 'font-mono')}
          />
          {errors.loginId && (
            <p className={fieldErrorClassName}>{errors.loginId.message}</p>
          )}
          <p className="mt-1 text-caption text-muted-foreground">
            Este ID será usado no login do sistema.
          </p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="nomeCompleto" className={fieldLabelClassName}>
            Nome Completo
          </label>
          <input
            id="nomeCompleto"
            {...register('nomeCompleto')}
            placeholder="João da Silva"
            className={fieldInputClassName}
          />
          {errors.nomeCompleto && (
            <p className={fieldErrorClassName}>{errors.nomeCompleto.message}</p>
          )}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="email" className={fieldLabelClassName}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="joao.silva@empresa.com"
            className={fieldInputClassName}
          />
          {errors.email && (
            <p className={fieldErrorClassName}>{errors.email.message}</p>
          )}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="telefone" className={fieldLabelClassName}>
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            {...register('telefone')}
            placeholder="+55 (11) 0000-0000"
            className={fieldInputClassName}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="senha" className={fieldLabelClassName}>
            {isEditMode ? 'Nova senha (opcional)' : 'Senha de acesso'}
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="new-password"
            {...register('senha')}
            placeholder={isEditMode ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
            className={fieldInputClassName}
          />
          {errors.senha && (
            <p className={fieldErrorClassName}>{errors.senha.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfessionalInfoSection({
  funcionarios,
}: {
  funcionarios: FuncionarioApi[];
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<UsuarioFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-surface-highest text-secondary">
          <Badge className="size-5" aria-hidden />
        </div>
        <h2 className="text-xl font-medium text-foreground">
          Vínculo com Funcionário
        </h2>
      </div>
      <div className="space-y-6">
        <div>
          <label htmlFor="employeeId" className={fieldLabelClassName}>
            Funcionário
          </label>
          <select
            id="employeeId"
            {...register('employeeId')}
            className={fieldInputClassName}
          >
            <option value="">Selecione o funcionário…</option>
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={String(funcionario.id)}>
                {funcionario.matricula} — {funcionario.nome}
              </option>
            ))}
          </select>
          {funcionarios.length === 0 && (
            <p className="mt-2 text-caption text-muted-foreground">
              Selecione ao menos uma unidade para listar os funcionários disponíveis.
            </p>
          )}
          {errors.employeeId && (
            <p className={fieldErrorClassName}>{errors.employeeId.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cargo" className={fieldLabelClassName}>
              Cargo
            </label>
            <select
              id="cargo"
              {...register('cargo')}
              className={fieldInputClassName}
            >
              <option value="">Selecione…</option>
              {CARGO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="departamento" className={fieldLabelClassName}>
              Departamento
            </label>
            <select
              id="departamento"
              {...register('departamento')}
              className={fieldInputClassName}
            >
              <option value="">Selecione…</option>
              {DEPARTAMENTO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilSelectionSection() {
  const { control } = useFormContext<UsuarioFormValues>();

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-surface-highest text-tertiary">
          <Key className="size-5" aria-hidden />
        </div>
        <h2 className="text-xl font-medium text-foreground">Seleção de Perfil</h2>
      </div>
      <p className="mb-6 text-caption text-muted-foreground">
        Selecione a liberação de segurança primária e o layout de UI para este
        usuário.
      </p>
      <Controller
        name="perfil"
        control={control}
        render={({ field }) => (
          <div className="space-y-3">
            {PERFIL_CADASTRO_OPTIONS.map((opcao) => (
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
    </div>
  );
}

function UnidadesSection({
  unidadesOpcoes,
  unidadesIds,
  onToggleUnidade,
  onRemoverUnidade,
  onAlterarNivelAcesso,
}: {
  unidadesOpcoes: UnidadeApi[];
  unidadesIds: string[];
  onToggleUnidade: (id: string) => void;
  onRemoverUnidade: (id: string) => void;
  onAlterarNivelAcesso: (id: string, nivel: UnidadeAcessoNivel) => void;
}) {
  const {
    watch,
    formState: { errors },
  } = useFormContext<UsuarioFormValues>();
  const unidades = watch('unidades');

  return (
    <div className={sectionCardClassName}>
      <div className="mb-6 flex items-center gap-3">
        <MapPin className="size-5 text-primary" aria-hidden />
        <h2 className="text-xl font-medium text-foreground">
          Unidades Atribuídas
        </h2>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
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
              </div>
            </label>
          ))
        )}
      </div>

      {errors.unidades && (
        <p className={cn(fieldErrorClassName, 'mb-4')}>
          {errors.unidades.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              <th className={compactTableHeadCellClassName('min-w-[120px]')}>
                Unidade
              </th>
              <th className={compactTableHeadCellClassName('hidden sm:table-cell')}>
                Filial
              </th>
              <th className={compactTableHeadCellClassName('w-32')}>
                Acesso
              </th>
              <th className={compactTableHeadCellClassName('w-8 text-right')}>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {unidades.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-caption text-muted-foreground"
                >
                  Selecione as unidades acima para atribuir acesso ao usuário.
                </td>
              </tr>
            ) : (
              unidades.map((unidade) => (
                <tr key={unidade.id} className={compactTableRowClassName}>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'text-[11px] font-semibold text-foreground',
                    )}
                  >
                    {unidade.nome}
                  </td>
                  <td
                    className={cn(
                      compactTableCellClassName,
                      'hidden text-[10px] text-muted-foreground sm:table-cell',
                    )}
                  >
                    {unidade.localizacao}
                  </td>
                  <td className={compactTableCellClassName}>
                    <select
                      value={unidade.nivelAcesso}
                      onChange={(event) =>
                        onAlterarNivelAcesso(
                          unidade.id,
                          event.target.value as UnidadeAcessoNivel,
                        )
                      }
                      className="w-full rounded border border-outline-variant bg-surface-low px-2 py-1 text-[10px] text-foreground"
                    >
                      {Object.entries(UNIDADE_ACESSO_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </td>
                  <td className={cn(compactTableCellClassName, 'text-right')}>
                    <button
                      type="button"
                      onClick={() => onRemoverUnidade(unidade.id)}
                      className="rounded p-1 text-destructive opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/20"
                      aria-label={`Remover ${unidade.nome}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UsuariosCadastroView() {
  const {
    form,
    isEditMode,
    isSubmitting,
    isLoading,
    unidadesOpcoes,
    unidadesIds,
    funcionariosFiltrados,
    toggleUnidade,
    alterarNivelAcesso,
    onSubmit,
    cancelar,
    removerUnidade,
  } = useUsuariosCadastro();

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex items-center gap-2 text-label-md"
          >
            <Link
              href="/usuarios"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Usuários
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">
              Registro de Usuário
            </span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant hover:bg-muted"
              onClick={cancelar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="usuario-cadastro-form"
              disabled={isSubmitting || isLoading}
              className="min-w-[9rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar Perfil de Usuário'
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-surface-lowest px-margin-mobile py-8 md:px-margin-desktop md:pb-28">
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : (
            <form
              id="usuario-cadastro-form"
              className="mx-auto max-w-container"
              onSubmit={onSubmit}
              noValidate
            >
              <div className="mb-8">
                <h1 className="text-headline-lg-mobile font-bold tracking-tight text-foreground md:text-headline-lg">
                  Registro de Usuário
                </h1>
                <p className="mt-2 text-body-md text-muted-foreground">
                  Configure identidade, vínculo com funcionário, perfil e
                  unidades de acesso.
                </p>
              </div>

              <div className="grid grid-cols-12 gap-gutter">
                <div className="col-span-12 lg:col-span-7">
                  <PersonalInfoSection isEditMode={isEditMode} />
                </div>
                <div className="col-span-12 lg:col-span-5">
                  <ProfessionalInfoSection funcionarios={funcionariosFiltrados} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <PerfilSelectionSection />
                </div>
                <div className="col-span-12 lg:col-span-8">
                  <UnidadesSection
                    unidadesOpcoes={unidadesOpcoes}
                    unidadesIds={unidadesIds}
                    onToggleUnidade={toggleUnidade}
                    onRemoverUnidade={removerUnidade}
                    onAlterarNivelAcesso={alterarNivelAcesso}
                  />
                </div>
              </div>
            </form>
          )}
        </main>
      </SidebarMain>
    </FormProvider>
  );
}
