import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandasV2View } from '@/features/recebimento-v2/views/lista-demandas-v2-view';

export const Route = createFileRoute('/recebimento-v2/')({
  component: ListaDemandasV2View,
});
