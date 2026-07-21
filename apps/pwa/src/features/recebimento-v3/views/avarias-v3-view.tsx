import { AvariasV2View } from '@/features/recebimento-v2/views/avarias-v2-view';

import { useAvariaV3 } from '../hooks/use-avaria-v3';

export function AvariasV3View(props: { demandId: string; sku?: string }) {
  const avariaApi = useAvariaV3(props.demandId);

  return (
    <AvariasV2View
      demandId={props.demandId}
      sku={props.sku}
      avariaApi={avariaApi}
      photoCaptureMode="native"
      backTo={{ to: '/recebimento-v3/$id/itens', params: { id: props.demandId } }}
    />
  );
}
