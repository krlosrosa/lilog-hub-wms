import type {
  EnderecoListaItem,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export type PosicaoSelecionada = {
  enderecoId: string;
  enderecoMascarado: string;
  zona?: string;
  tipo?: EnderecoTipo;
  status?: EnderecoStatus;
};

export function mapListaItemToPosicaoSelecionada(
  item: EnderecoListaItem,
): PosicaoSelecionada {
  return {
    enderecoId: item.id,
    enderecoMascarado: item.enderecoId,
    zona: item.zona,
    tipo: item.tipo,
    status: item.status,
  };
}
