'use client';

import { Loader2 } from 'lucide-react';

import { InspecaoCard } from '@/features/recebimento/components/inspecao-card';
import { FotosEvidencias } from '@/features/recebimento/components/fotos-evidencia';
import type { CncRecebimentoContext } from '@/features/cnc/hooks/use-cnc-recebimento-context';

type CncChecklistPanelProps = {
  context: CncRecebimentoContext;
  embedded?: boolean;
};

export function CncChecklistPanel({
  context,
  embedded = false,
}: CncChecklistPanelProps) {
  if (context.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-glass-bg px-4 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando checklist do recebimento…
      </div>
    );
  }

  if (context.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
        {context.error}
      </div>
    );
  }

  if (!context.inspecao) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Checklist não disponível
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Esta CNC não possui origem em recebimento ou o checklist ainda não foi
          preenchido.
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-4'}>
      {!embedded ? (
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Checklist do recebimento
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Inspeção térmica, condições do baú e evidências registradas no PWA
            durante o recebimento.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <InspecaoCard inspecao={context.inspecao} />
        <FotosEvidencias
          fotos={context.fotosChecklist}
          totalInformado={context.fotoTotalInformado}
        />
      </div>
    </div>
  );
}
