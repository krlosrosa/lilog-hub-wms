import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { CheckCircle2, Circle } from 'lucide-react';

import type {
  CaixaRegistrada,
  Etiqueta,
} from '../types/peso-variavel.schema';

interface EtiquetasListaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiquetas: Etiqueta[];
  conferidas: CaixaRegistrada[];
}

function EtiquetaRow({
  etiqueta,
  conferida,
}: {
  etiqueta: Etiqueta;
  conferida?: CaixaRegistrada;
}) {
  const isConferida = conferida != null;

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5',
        isConferida
          ? 'border-secondary/40 bg-secondary-container/30'
          : 'border-outline-variant bg-surface-container',
      )}
    >
      {isConferida ? (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-secondary"
          aria-hidden
        />
      ) : (
        <Circle
          className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant opacity-50"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-label-md font-bold text-on-surface">
            {etiqueta.codigo}
          </span>
          {isConferida && (
            <span className="shrink-0 font-mono text-label-sm font-semibold text-secondary">
              {conferida.pesoKg.toFixed(2)} kg
            </span>
          )}
        </div>
        <p className="truncate text-body-sm text-on-surface">{etiqueta.nome}</p>
        <p className="font-mono text-label-sm text-on-surface-variant">
          {etiqueta.lote} · {etiqueta.sku}
        </p>
      </div>
    </li>
  );
}

export function EtiquetasListaSheet({
  open,
  onOpenChange,
  etiquetas,
  conferidas,
}: EtiquetasListaSheetProps) {
  const conferidasMap = new Map(
    conferidas.map((c) => [c.etiquetaId, c] as const),
  );

  const pendentes = etiquetas.filter((e) => !conferidasMap.has(e.id));
  const conferidasList = etiquetas
    .map((e) => ({ etiqueta: e, conferida: conferidasMap.get(e.id) }))
    .filter((item): item is { etiqueta: Etiqueta; conferida: CaixaRegistrada } =>
      item.conferida != null,
    );

  const progressPercent =
    etiquetas.length > 0
      ? (conferidas.length / etiquetas.length) * 100
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant"
          aria-hidden
        />

        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-md text-on-surface">
            Etiquetas — {conferidas.length}/{etiquetas.length} conferidas
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Lista de caixas a conferir e já conferidas nesta tarefa
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={conferidas.length}
              aria-valuemin={0}
              aria-valuemax={etiquetas.length}
            />
          </div>
        </div>

        <div className="mt-4 max-h-[55vh] space-y-5 overflow-y-auto overscroll-contain">
          {pendentes.length > 0 && (
            <section>
              <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                A conferir ({pendentes.length})
              </h4>
              <ul className="space-y-2" role="list">
                {pendentes.map((etiqueta) => (
                  <EtiquetaRow key={etiqueta.id} etiqueta={etiqueta} />
                ))}
              </ul>
            </section>
          )}

          {conferidasList.length > 0 && (
            <section>
              <h4 className="mb-2 text-label-md font-semibold uppercase tracking-wider text-secondary">
                Conferidas ({conferidasList.length})
              </h4>
              <ul className="space-y-2" role="list">
                {conferidasList.map(({ etiqueta, conferida }) => (
                  <EtiquetaRow
                    key={etiqueta.id}
                    etiqueta={etiqueta}
                    conferida={conferida}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
