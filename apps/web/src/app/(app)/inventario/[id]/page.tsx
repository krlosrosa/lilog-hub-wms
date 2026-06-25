import { InventarioDetalheView } from '@/features/inventario';

export default async function InventarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InventarioDetalheView inventarioId={id} />;
}
