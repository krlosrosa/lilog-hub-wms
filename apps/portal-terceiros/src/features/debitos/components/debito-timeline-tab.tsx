import { formatData, type CobrancaEvento } from '../types/debito.types';

type DebitoTimelineTabProps = {
  eventos: CobrancaEvento[];
};

export function DebitoTimelineTab({ eventos }: DebitoTimelineTabProps) {
  const ordenados = [...eventos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (ordenados.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <ol className="relative space-y-2.5 border-l border-border/60 pl-4">
      {ordenados.map((evento) => (
        <li key={evento.id} className="relative">
          <span
            className="absolute -left-[1.15rem] top-1.5 size-2 rounded-full bg-primary/60 ring-2 ring-background"
            aria-hidden
          />
          <div className="rounded-lg border border-border/60 bg-muted/15 px-2.5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {evento.statusAnterior && evento.statusAnterior !== evento.statusNovo
                  ? `Status: ${evento.statusAnterior} → ${evento.statusNovo}`
                  : 'Atualização do processo'}
              </p>
              <time className="text-[10px] text-muted-foreground">
                {formatData(evento.createdAt)}
              </time>
            </div>
            {evento.descricao ? (
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {evento.descricao}
              </p>
            ) : null}
            {evento.criadoPorNome ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Por {evento.criadoPorNome}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
