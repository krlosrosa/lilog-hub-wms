import type { ConferenciaAvaria } from '@/features/recebimento/types/recebimento-detalhe.schema';

const AVARIA_TIPO_LABELS: Record<string, string> = {
  fisica: 'Avaria Física',
  embalagem: 'Embalagem',
  qualidade: 'Qualidade',
  documental: 'Documental',
};

const AVARIA_NATUREZA_LABELS: Record<string, string> = {
  parcial: 'Avaria Parcial',
  total: 'Avaria Total',
  superficial: 'Avaria Superficial',
  irreversivel: 'Avaria Irreversível',
};

const AVARIA_CAUSA_LABELS: Record<string, string> = {
  transporte: 'Transporte',
  manuseio: 'Manuseio',
  armazenamento: 'Armazenamento',
  fornecedor: 'Fornecedor',
  indeterminada: 'Indeterminada',
};

function resolveLabel(
  map: Record<string, string>,
  value: string,
): string {
  return map[value] ?? value;
}

export function getConferenciaAvariaLabels(avaria: ConferenciaAvaria) {
  return {
    tipo: resolveLabel(AVARIA_TIPO_LABELS, avaria.tipo),
    natureza: resolveLabel(AVARIA_NATUREZA_LABELS, avaria.natureza),
    causa: resolveLabel(AVARIA_CAUSA_LABELS, avaria.causa),
  };
}
