import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { DetalheItemV2View } from '@/features/recebimento-v2/views/detalhe-item-v2-view';

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

export const Route = createFileRoute('/recebimento-v2/$id/')({
  validateSearch: searchSchema,
  component: function DetalheItemPage() {
    const { id } = Route.useParams();
    const { sku } = Route.useSearch();
    return <DetalheItemV2View demandId={id} sku={sku} />;
  },
});
