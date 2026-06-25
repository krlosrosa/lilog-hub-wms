'use client';

import { Loader2, UserMinus, UserPlus } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import type { DocaSelectItem } from '@/features/gestao-recursos/lib/doca-api';
import type { DemandaSeparacaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import { UsuarioAvatar } from '@/features/usuarios/components/usuario-avatar';

type CarregamentoDemandaCardProps = {
  demanda: DemandaSeparacaoApi;
  funcionarios: SessaoFuncionarioApi[];
  docas?: DocaSelectItem[];
  isSubmitting: boolean;
  finalizandoDemandaId: string | null;
  removendoFuncionarioId: string | null;
  onAdicionarAuxiliar: (demanda: DemandaSeparacaoApi) => void;
  onRemoverAuxiliar: (
    demandaId: string,
    sessaoFuncionarioId: string,
  ) => void;
  onFinalizarDemanda: (
    demandaId: string,
    mapaTitulo?: string,
    operatorId?: string,
  ) => void;
};

function resolverNomeFuncionario(
  sessaoFuncionarioId: string,
  funcionarioId: number,
  funcionarios: SessaoFuncionarioApi[],
): string {
  return (
    funcionarios.find((item) => item.id === sessaoFuncionarioId)?.nome ??
    funcionarios.find((item) => item.funcionarioId === funcionarioId)?.nome ??
    'Funcionário'
  );
}

function resolverDocaCodigo(
  docaId: string | null | undefined,
  docas: DocaSelectItem[],
): string | null {
  if (!docaId) {
    return null;
  }

  return docas.find((doca) => doca.id === docaId)?.codigo ?? null;
}

export function CarregamentoDemandaCard({
  demanda,
  funcionarios,
  docas = [],
  isSubmitting,
  finalizandoDemandaId,
  removendoFuncionarioId,
  onAdicionarAuxiliar,
  onRemoverAuxiliar,
  onFinalizarDemanda,
}: CarregamentoDemandaCardProps) {
  const equipe = demanda.funcionarios ?? [];
  const finalizando = finalizandoDemandaId === demanda.id;
  const docaCodigo = resolverDocaCodigo(demanda.transporteDocaId, docas);
  const lacre = demanda.transporteLacreCarregamento?.trim();

  return (
    <article className="group px-3 py-3 transition-colors hover:bg-surface-high/25 sm:px-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-label-md font-semibold text-foreground">
              {demanda.mapaGrupoTitulo}
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">
              {demanda.mapaGrupoMicroUuid}
            </span>
          </div>
          <p className="text-caption text-muted-foreground">
            {demanda.transporteRota ?? 'Sem rota'} ·{' '}
            {formatarTempoEsperado(demanda.tempoEsperadoMinutos * 60).minutos}{' '}
            min
            {docaCodigo ? ` · Doca ${docaCodigo}` : ''}
            {lacre ? ` · Lacre ${lacre}` : ''}
          </p>
        </div>

        <div className="min-w-0 xl:max-w-md xl:flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Equipe · {equipe.length}
          </p>
          <ul className="flex flex-col gap-1">
            {equipe.map((membro) => {
              const nome = resolverNomeFuncionario(
                membro.sessaoFuncionarioId,
                membro.funcionarioId,
                funcionarios,
              );
              const isResponsavel = membro.papel === 'responsavel';
              const removendo =
                removendoFuncionarioId === membro.sessaoFuncionarioId;

              return (
                <li
                  key={membro.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-surface-high/35 px-2 py-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <UsuarioAvatar nome={nome} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-caption font-medium text-foreground">
                        {nome}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] font-semibold uppercase',
                          isResponsavel
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {isResponsavel ? 'Responsável' : 'Auxiliar'}
                      </p>
                    </div>
                  </div>

                  {!isResponsavel ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 p-0 text-destructive"
                      disabled={isSubmitting || removendo}
                      onClick={() =>
                        void onRemoverAuxiliar(
                          demanda.id,
                          membro.sessaoFuncionarioId,
                        )
                      }
                      aria-label={`Remover ${nome}`}
                    >
                      {removendo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:flex-col xl:items-stretch">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-caption"
            disabled={isSubmitting || finalizando}
            onClick={() => onAdicionarAuxiliar(demanda)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Auxiliar
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 text-caption"
            disabled={isSubmitting || finalizando}
            onClick={() =>
              onFinalizarDemanda(
                demanda.id,
                demanda.mapaGrupoTitulo,
                demanda.sessaoFuncionarioId,
              )
            }
          >
            {finalizando ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Finalizando...
              </>
            ) : (
              'Finalizar'
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
