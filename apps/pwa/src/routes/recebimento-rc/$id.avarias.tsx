import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { RequireChecklistRcGate } from '@/features/recebimento-rc/components/require-checklist-rc-gate';
import { AvariasRcView } from '@/features/recebimento-rc/views/avarias-rc-view';

const searchSchema = z.object({
  sku: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const normalized = value.trim().replace(/^["']+|["']+$/g, '');
      return normalized || undefined;
    }),
});

export const Route = createFileRoute('/recebimento-rc/$id/avarias')({
  validateSearch: searchSchema,
  component: function AvariasRcPage() {
    const { id } = Route.useParams();
    const { sku } = Route.useSearch();
    return (
      <RequireChecklistRcGate demandId={id}>
        <AvariasRcView demandId={id} sku={sku} />
      </RequireChecklistRcGate>
    );
  },
});
