import { InventarioNovaDemandaView } from '@/features/inventario';

export default async function InventarioDetalheNovaDemandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InventarioNovaDemandaView inventarioId={id} />;
}
