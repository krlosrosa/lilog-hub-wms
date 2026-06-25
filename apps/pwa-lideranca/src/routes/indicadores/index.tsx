import { createFileRoute } from '@tanstack/react-router';

import { IndicadoresView } from '@/features/indicadores/views/indicadores-view';

export const Route = createFileRoute('/indicadores/')({
  component: IndicadoresView,
});
