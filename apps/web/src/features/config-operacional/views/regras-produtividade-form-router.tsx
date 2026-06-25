'use client';

import { RegraCarregamentoFormView } from '@/features/regras-carregamento/views/regra-carregamento-form-view';
import { RegraConferenciaFormView } from '@/features/regras-conferencia/views/regra-conferencia-form-view';
import { RegraExpedicaoFormView } from '@/features/regras-expedicao/views/regra-expedicao-form-view';
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
  tipo,
}: RegrasProdutividadeFormRouterProps) {
  if (tipo === 'conferencia') {
    return <RegraConferenciaFormView regraId={regraId} />;
  }
  if (tipo === 'carregamento') {
    return <RegraCarregamentoFormView regraId={regraId} />;
  }
  return <RegraExpedicaoFormView regraId={regraId} />;
}

export { parseEtapaProdutividade };
