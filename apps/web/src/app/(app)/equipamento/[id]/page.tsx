import { EquipamentoDossieView } from '@/features/equipamento';

type EquipamentoDossiePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipamentoDossiePage({
  params,
}: EquipamentoDossiePageProps) {
  const { id } = await params;
  return <EquipamentoDossieView equipamentoId={id} />;
}
