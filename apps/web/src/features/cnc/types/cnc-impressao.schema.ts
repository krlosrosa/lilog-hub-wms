import { z } from 'zod';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';

export type CncOrigemAvariaImpressao =
  | 'transferencia'
  | 'avaria_interna'
  | 'devolucao';

export type CncTipoCargaImpressao =
  | 'estivada'
  | 'paletizada'
  | 'paletizada_estivada';

export type CncPalletAvariadoImpressao = 'padrao' | 'misto' | 'padrao_misto';

export type CncLocalAvariaImpressao =
  | 'parte_superior'
  | 'meio'
  | 'base_inferior';

export type CncImpressaoOpcoes = {
  origemAvaria: CncOrigemAvariaImpressao | null;
  tipoCarga: CncTipoCargaImpressao | null;
  palletAvariado: CncPalletAvariadoImpressao | null;
  localAvaria: CncLocalAvariaImpressao[];
};

export const cncImpressaoOpcoesSchema = z.object({
  origemAvaria: z
    .enum(['transferencia', 'avaria_interna', 'devolucao'])
    .nullable(),
  tipoCarga: z.enum(['estivada', 'paletizada', 'paletizada_estivada']).nullable(),
  palletAvariado: z.enum(['padrao', 'misto', 'padrao_misto']).nullable(),
  localAvaria: z.array(
    z.enum(['parte_superior', 'meio', 'base_inferior']),
  ),
});

export const CNC_IMPRESSAO_OPCOES_VAZIAS: CncImpressaoOpcoes = {
  origemAvaria: null,
  tipoCarga: null,
  palletAvariado: null,
  localAvaria: [],
};

export const CNC_OPCOES_IMPRESSAO_PADRAO: CncImpressaoOpcoes = {
  origemAvaria: 'transferencia',
  tipoCarga: 'paletizada',
  palletAvariado: 'padrao',
  localAvaria: [],
};

export const CNC_ORIGEM_AVARIA_OPCOES: Array<{
  value: CncOrigemAvariaImpressao;
  label: string;
}> = [
  { value: 'transferencia', label: 'Transferência' },
  { value: 'avaria_interna', label: 'Avaria Interna' },
  { value: 'devolucao', label: 'Devolução' },
];

export const CNC_TIPO_CARGA_OPCOES: Array<{
  value: CncTipoCargaImpressao;
  label: string;
}> = [
  { value: 'estivada', label: 'Carga Estivada' },
  { value: 'paletizada', label: 'Carga Paletizada' },
  { value: 'paletizada_estivada', label: 'Paletizada e Estivada' },
];

export const CNC_PALLET_AVARIADO_OPCOES: Array<{
  value: CncPalletAvariadoImpressao;
  label: string;
}> = [
  { value: 'padrao', label: 'Pallet Padrão' },
  { value: 'misto', label: 'Pallet Misto' },
  { value: 'padrao_misto', label: 'Padrão e Misto' },
];

export const CNC_LOCAL_AVARIA_OPCOES: Array<{
  value: CncLocalAvariaImpressao;
  label: string;
}> = [
  { value: 'parte_superior', label: 'Parte superior' },
  { value: 'meio', label: 'Meio' },
  { value: 'base_inferior', label: 'Base/Inferior' },
];

export function resolverOpcoesImpressao(
  opcoesSalvas: CncImpressaoOpcoes | null | undefined,
): CncImpressaoOpcoes {
  return opcoesSalvas ?? CNC_OPCOES_IMPRESSAO_PADRAO;
}

export function sugerirOpcoesImpressao(cnc: CncDetalhe): CncImpressaoOpcoes {
  if (cnc.opcoesImpressao) {
    return cnc.opcoesImpressao;
  }

  let origemAvaria: CncOrigemAvariaImpressao | null = null;

  switch (cnc.responsavel) {
    case 'transportadora':
      origemAvaria = 'transferencia';
      break;
    case 'fornecedor':
      origemAvaria = 'devolucao';
      break;
    case 'fabrica':
    case 'operacao':
      origemAvaria = 'avaria_interna';
      break;
    default:
      origemAvaria = null;
  }

  return {
    origemAvaria,
    tipoCarga: null,
    palletAvariado: cnc.itens.some((item) => item.tipo === 'avaria')
      ? 'padrao'
      : null,
    localAvaria: [],
  };
}
