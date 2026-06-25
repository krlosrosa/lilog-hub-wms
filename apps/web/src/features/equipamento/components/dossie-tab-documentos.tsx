'use client';

import { cn } from '@lilog/ui';
import { FileText } from 'lucide-react';

import type { EquipamentoDossie } from '@/features/equipamento/types/equipamento.schema';

const DOC_STATUS_CLASSES = {
  valido: 'text-status-active',
  vencendo: 'text-tertiary',
  vencido: 'text-destructive',
} as const;

type DossieTabDocumentosProps = {
  equipamento: EquipamentoDossie;
};

export function DossieTabDocumentos({ equipamento }: DossieTabDocumentosProps) {
  return (
    <div className="space-y-3">
      {equipamento.documentos.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-glass-bg px-6 py-4 backdrop-blur-glass"
        >
          <div className="flex items-center gap-4">
            <FileText className="size-5 text-primary" aria-hidden />
            <div>
              <p className="text-title-md font-medium text-foreground">
                {doc.nome}
              </p>
              <p className="font-mono text-caption text-muted-foreground">
                Vencimento: {doc.vencimento}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-caption font-semibold uppercase',
              DOC_STATUS_CLASSES[doc.status],
            )}
          >
            {doc.status}
          </span>
        </div>
      ))}
    </div>
  );
}
