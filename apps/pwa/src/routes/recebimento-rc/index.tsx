import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandasRcView } from '@/features/recebimento-rc/views/lista-demandas-rc-view';

export const Route = createFileRoute('/recebimento-rc/')({
  component: ListaDemandasRcView,
});
