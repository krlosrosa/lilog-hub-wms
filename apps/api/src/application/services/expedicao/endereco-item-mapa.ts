import type { ProdutoEnderecoPapel } from '../../../domain/model/produto-endereco/produto-endereco.model.js';

export type EnderecoItemMapa = {
  endereco: string;
  enderecoId: string;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  prioridadePicking: number | null;
  slottingOrdem: number | null;
  slottingPapel: ProdutoEnderecoPapel | null;
};

export type EnderecoItemMapaCampos = {
  endereco?: string | null;
  enderecoId?: string | null;
  zona?: string | null;
  rua?: string | null;
  posicao?: string | null;
  nivel?: string | null;
  prioridadePicking?: number | null;
  slottingOrdem?: number | null;
  slottingPapel?: ProdutoEnderecoPapel | null;
};

export function camposEnderecoVazios(): EnderecoItemMapaCampos {
  return {
    endereco: null,
    enderecoId: null,
    zona: null,
    rua: null,
    posicao: null,
    nivel: null,
    prioridadePicking: null,
    slottingOrdem: null,
    slottingPapel: null,
  };
}

export function enderecoItemMapaParaCampos(
  endereco: EnderecoItemMapa | null | undefined,
): EnderecoItemMapaCampos {
  if (!endereco) {
    return camposEnderecoVazios();
  }

  return {
    endereco: endereco.endereco,
    enderecoId: endereco.enderecoId,
    zona: endereco.zona,
    rua: endereco.rua,
    posicao: endereco.posicao,
    nivel: endereco.nivel,
    prioridadePicking: endereco.prioridadePicking,
    slottingOrdem: endereco.slottingOrdem,
    slottingPapel: endereco.slottingPapel,
  };
}
