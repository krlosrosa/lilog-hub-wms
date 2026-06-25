'use client';

import Link from 'next/link';

import { Lightbulb, Search } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { PerfilSelector } from '@/features/usuarios/components/perfil-selector';
import { PermissaoMatrix } from '@/features/usuarios/components/permissao-matrix';
import {
  fieldInputClassName,
  glassPanelClassName,
} from '@/features/usuarios/components/usuario-form-field-classes';
import { useUsuariosPerfis } from '@/features/usuarios/hooks/use-usuarios-perfis';

export function UsuariosPerfisView() {
  const {
    perfis,
    perfilSelecionado,
    selecionarPerfil,
    modulos,
    togglePermissao,
    descartarAlteracoes,
    salvarPermissoes,
    isSaving,
    hasChanges,
    busca,
    setBusca,
    exportarCsv,
  } = useUsuariosPerfis();

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-8">
          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Usuários
              </h1>
              <nav
                aria-label="Seções de gestão de usuários"
                className="mt-4 flex flex-wrap gap-4 border-b border-outline-variant pb-1"
              >
                <Link
                  href="/usuarios"
                  className="pb-1 text-label-md text-muted-foreground transition-colors hover:text-primary"
                >
                  Usuários
                </Link>
                <Link
                  href="/usuarios/perfis"
                  className="border-b-2 border-primary pb-1 text-label-md text-primary"
                >
                  Funções
                </Link>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar funções..."
                  className={cn(
                    fieldInputClassName,
                    'w-64 rounded-full py-1.5 pl-10 text-sm',
                  )}
                  aria-label="Pesquisar funções"
                />
              </div>
              <Button variant="outline" onClick={exportarCsv}>
                Exportar CSV
              </Button>
              <Button>Criar Novo Perfil</Button>
            </div>
          </header>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-foreground">
                Funções e Permissões
              </h2>
              <p className="mt-1 text-body-md text-muted-foreground">
                Configure os níveis de acesso e as restrições dos módulos em
                toda a empresa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3">
              <PerfilSelector
                perfis={perfis}
                perfilSelecionado={perfilSelecionado}
                onSelectPerfil={selecionarPerfil}
              />
            </div>
            <div className="col-span-12 lg:col-span-9">
              <PermissaoMatrix
                modulos={modulos}
                onTogglePermissao={togglePermissao}
                onDescartar={descartarAlteracoes}
                onSalvar={salvarPermissoes}
                isSaving={isSaving}
                hasChanges={hasChanges}
              />

              <div
                className={cn(
                  glassPanelClassName,
                  'mt-6 flex items-center border-tertiary/20 bg-tertiary/10 p-4',
                )}
              >
                <Lightbulb className="mr-4 size-5 text-tertiary" aria-hidden />
                <p className="text-sm text-foreground">
                  <span className="font-bold text-tertiary">Dica:</span> Você
                  pode usar a seleção em massa clicando no cabeçalho do módulo
                  para alternar todas as permissões desse módulo específico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
