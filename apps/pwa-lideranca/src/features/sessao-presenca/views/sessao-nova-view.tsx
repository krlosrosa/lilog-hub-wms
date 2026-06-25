import { Button } from '@lilog/ui';
import { Loader2, Moon, Search } from 'lucide-react';
import { useEffect } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { EscalaPickerCard } from '../components/escala-picker-card';
import { FeatureToastPortal } from '../components/feature-toast';
import { SessaoSubHeader } from '../components/sessao-sub-header';
import { useSessaoNova } from '../hooks/use-sessao-nova';

export function SessaoNovaView() {
  const { state, actions } = useSessaoNova();
  const {
    escalas,
    escalaId,
    dataReferencia,
    busca,
    preview,
    isLoading,
    isSubmitting,
    missingUnidadeId,
    isEmpty,
    toast,
  } = state;

  useEffect(() => {
    if (escalas.length === 1 && !escalaId) {
      actions.setEscalaId(escalas[0]!.id);
    }
  }, [actions, escalaId, escalas]);

  return (
    <div className="page-enter flex flex-col pb-32">
      <FeatureToastPortal toast={toast} />

      <SessaoSubHeader
        backTo="/sessao-presenca"
        backLabel="Voltar para sessões"
        title="Nova sessão"
        subtitle="Selecione escala e data"
      />

      <div className="space-y-4 px-margin-mobile pt-3">
        {missingUnidadeId ? (
          <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
            Selecione uma unidade para criar uma sessão.
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden />
          </div>
        ) : isEmpty ? (
          <div className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-body-sm text-on-surface-variant">
            Nenhuma escala ativa nesta unidade. Cadastre escalas no painel web
            primeiro.
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="data-referencia"
                className="mb-1 block text-label-sm font-medium text-on-surface-variant"
              >
                Data de referência
              </label>
              <input
                id="data-referencia"
                type="date"
                value={dataReferencia}
                onChange={(e) => actions.setDataReferencia(e.target.value)}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface px-3 text-body-sm text-on-surface"
              />
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Dia em que o turno começa (turnos noturnos podem terminar no dia
                seguinte).
              </p>
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => actions.setBusca(e.target.value)}
                placeholder="Buscar escala ou equipe..."
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface py-2 pl-10 pr-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/60"
              />
            </div>

            <div className="space-y-2">
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Escalas disponíveis
              </p>
              {escalas.map((escala) => (
                <EscalaPickerCard
                  key={escala.id}
                  escala={escala}
                  selected={escalaId === escala.id}
                  onSelect={actions.setEscalaId}
                />
              ))}
            </div>

            {preview ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="text-label-md font-semibold text-on-surface">
                  Resumo do turno
                </p>
                <ul className="mt-2 space-y-1 text-body-sm text-on-surface-variant">
                  <li>Equipe: {preview.equipeNome}</li>
                  <li className="flex items-center gap-1">
                    Horário: {preview.intervalo}
                    {preview.cruzaMeiaNoite ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-medium">
                        <Moon className="h-3 w-3" aria-hidden />
                        Noturno
                      </span>
                    ) : null}
                  </li>
                  <li>Funcionários esperados: {preview.totalFuncionarios}</li>
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>

      {!missingUnidadeId && !isLoading && !isEmpty ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/95 pb-safe backdrop-blur-md">
          <div className="space-y-2 px-margin-mobile py-3">
            <Button
              type="button"
              disabled={isSubmitting || !escalaId}
              onClick={() => {
                hapticMedium();
                void actions.criar(true);
              }}
              className="h-12 w-full gap-2 rounded-lg bg-secondary text-on-secondary"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : null}
              Criar e abrir
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || !escalaId}
              onClick={() => {
                hapticMedium();
                void actions.criar(false);
              }}
              className="h-11 w-full"
            >
              Apenas criar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
