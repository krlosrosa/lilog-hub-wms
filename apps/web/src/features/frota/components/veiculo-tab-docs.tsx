'use client';

import { Button, cn } from '@lilog/ui';

import {
  DOCUMENTO_STATUS_LABELS,
  type VeiculoDocumento,
} from '@/features/frota/types/frota.schema';

type VeiculoTabDocsProps = {
  documentos: VeiculoDocumento[];
  onUpload?: (docId: string) => void;
};

const STATUS_CLASS = {
  valid: 'border-primary/30 bg-primary/15 text-primary',
  expiring: 'border-destructive/30 bg-destructive/15 text-destructive',
  expired: 'border-destructive/30 bg-destructive/20 text-destructive',
} as const;

export function VeiculoTabDocs({ documentos, onUpload }: VeiculoTabDocsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-container-high">
          <tr>
            <th className="p-4 text-label-sm font-medium text-muted-foreground">
              Tipo de documento
            </th>
            <th className="p-4 text-label-sm font-medium text-muted-foreground">
              Vencimento
            </th>
            <th className="p-4 text-label-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="p-4 text-right text-label-sm font-medium text-muted-foreground">
              Ação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {documentos.map((doc) => (
            <tr
              key={doc.id}
              className="transition-colors hover:bg-surface-container-low"
            >
              <td className="p-4 text-body-md text-foreground">{doc.tipo}</td>
              <td className="p-4 text-body-md text-foreground">
                {doc.vencimento}
              </td>
              <td className="p-4">
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 text-[10px] font-medium uppercase',
                    STATUS_CLASS[doc.status],
                  )}
                >
                  {DOCUMENTO_STATUS_LABELS[doc.status]}
                </span>
              </td>
              <td className="p-4 text-right">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => onUpload?.(doc.id)}
                >
                  Enviar novo
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
