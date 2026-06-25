'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import { AlertasOperacionaisFeed } from '@/features/torre-controle-expedicao/components/alertas-operacionais-feed';
import type { AlertaOperacional } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type AlertasOperacionaisSheetProps = {
  open: boolean;
  alertas: AlertaOperacional[];
  onOpenChange: (open: boolean) => void;
  onAlertClick: (alerta: AlertaOperacional) => void;
};

export function AlertasOperacionaisSheet({
  open,
  alertas,
  onOpenChange,
  onAlertClick,
}: AlertasOperacionaisSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Centro de Alertas</SheetTitle>
          <SheetDescription>
            {alertas.length === 0
              ? 'Nenhum alerta operacional no momento.'
              : `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''} ativo${alertas.length !== 1 ? 's' : ''}.`}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden pt-2">
          <AlertasOperacionaisFeed
            alertas={alertas}
            onAlertClick={(alerta) => {
              onOpenChange(false);
              onAlertClick(alerta);
            }}
            variant="sheet"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
