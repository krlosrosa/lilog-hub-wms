'use client';

import Link from 'next/link';

import { Button } from '@lilog/ui';
import { CalendarClock, ChevronRight, Loader2, Save } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import { useSessaoCadastro } from '@/features/sessao-operacao/hooks/use-sessao-cadastro';

export function SessaoCadastroView() {
  const {
    unidadeId,
    escalas,
    form,
    isLoading,
    isSubmitting,
    previewHorario,
    updateField,
    salvar,
  } = useSessaoCadastro();

  return (
    <SidebarMain>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-label-md text-muted-foreground"
        >
          <Link
            href="/sessao-operacao/sessoes"
            className="transition-colors hover:text-primary"
          >
            Sessões
          </Link>
          <ChevronRight className="size-4" aria-hidden />
          <span className="text-foreground">Nova sessão</span>
        </nav>

        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <CalendarClock className="size-5" aria-hidden />
            <span className="text-label-md font-bold uppercase tracking-wide">
              Sessão Operação
            </span>
          </div>
          <h1 className="text-headline-sm font-bold text-foreground">
            Nova Sessão de Trabalho
          </h1>
          <p className="mt-1 text-body-sm text-muted-foreground">
            Selecione a escala e a data em que o turno começa.
          </p>
        </div>

        {!unidadeId && (
          <div className="rounded-xl border border-dashed border-outline-variant p-6 text-body-sm text-muted-foreground">
            Selecione uma unidade para criar uma sessão.
          </div>
        )}

        {unidadeId && (
          <div className="space-y-6 rounded-xl border border-outline-variant bg-card p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : escalas.length === 0 ? (
              <div className="text-body-sm text-muted-foreground">
                <p>Nenhuma escala ativa encontrada nesta unidade.</p>
                <Button asChild variant="link" className="mt-2 px-0">
                  <Link href="/sessao-operacao/escalas">
                    Cadastrar escalas primeiro
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="escalaId"
                    className="mb-1 block text-body-sm font-medium text-foreground"
                  >
                    Escala
                  </label>
                  <select
                    id="escalaId"
                    value={form.escalaId}
                    onChange={(event) =>
                      updateField('escalaId', event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-outline-variant bg-background px-3 text-body-sm"
                  >
                    <option value="">Selecione uma escala</option>
                    {escalas.map((escala) => (
                      <option key={escala.id} value={escala.id}>
                        {escala.nome} — {escala.equipeNome} (
                        {escala.totalFuncionarios} func.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="dataReferencia"
                    className="mb-1 block text-body-sm font-medium text-foreground"
                  >
                    Data de referência
                  </label>
                  <input
                    id="dataReferencia"
                    type="date"
                    value={form.dataReferencia}
                    onChange={(event) =>
                      updateField('dataReferencia', event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-outline-variant bg-background px-3 text-body-sm"
                  />
                  <p className="mt-1 text-caption text-muted-foreground">
                    Dia em que o turno começa (turnos noturnos podem terminar no dia seguinte).
                  </p>
                </div>

                {previewHorario && (
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-high p-4">
                    <p className="text-label-md font-semibold text-foreground">
                      Resumo do turno
                    </p>
                    <div className="mt-2 space-y-1 text-body-sm text-muted-foreground">
                      <p>Equipe: {previewHorario.equipeNome}</p>
                      <p className="flex items-center gap-2">
                        Horário: {previewHorario.intervalo}
                        {previewHorario.cruzaMeiaNoite && (
                          <EscalaTurnoBadge cruzaMeiaNoite />
                        )}
                      </p>
                      <p>
                        Funcionários esperados: {previewHorario.totalFuncionarios}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
                  <Button asChild variant="ghost" disabled={isSubmitting}>
                    <Link href="/sessao-operacao/sessoes">Cancelar</Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void salvar()}
                    disabled={isSubmitting || !form.escalaId}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-4" aria-hidden />
                    )}
                    Criar sessão
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </SidebarMain>
  );
}
