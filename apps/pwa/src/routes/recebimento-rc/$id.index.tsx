import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { DetalheItemRcView } from '@/features/recebimento-rc/views/detalhe-item-rc-view';

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

export const Route = createFileRoute('/recebimento-rc/$id/')({
  validateSearch: searchSchema,
  component: function DetalheItemRcPage() {
    const { id } = Route.useParams();
    const { sku } = Route.useSearch();
    return <DetalheItemRcView demandId={id} sku={sku} />;
  },
});
