import { InventarioDetalheView } from '@/features/inventario';

export default function InventarioDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <InventarioDetalheView inventarioId={params.id} />;
}
