'use client';

import { RegraConferenciaFormView } from '@/features/regras-conferencia/views/regra-conferencia-form-view';
import {
  parseEtapaProdutividade,
  type EtapaProdutividade,
} from '@/features/config-operacional/types/regra-produtividade-tabs';

type RegrasProdutividadeFormRouterProps = {
  regraId?: string;
  tipo: EtapaProdutividade;
};

export function RegrasProdutividadeFormRouter({
  regraId,
}: RegrasProdutividadeFormRouterProps) {
  return <RegraConferenciaFormView regraId={regraId} />;
}

export { parseEtapaProdutividade };
