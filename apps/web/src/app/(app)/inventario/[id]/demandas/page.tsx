import { InventarioDemandaView } from '@/features/inventario';

export default async function InventarioDemandasByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InventarioDemandaView inventarioId={id} />;
}
