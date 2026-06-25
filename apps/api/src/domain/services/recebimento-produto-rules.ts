import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import type { ConferirItemInput } from '../model/recebimento/recebimento.model.js';

export type ProdutoConferenciaConfig = {
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  controlaNumeroSerie: boolean;
};

export function resolveProdutoConferenciaConfig(
  produto: ProdutoRecord,
): ProdutoConferenciaConfig {
  return {
    controlaLote: produto.categoria === 'refrigerado' || produto.categoria === 'queijo',
    controlaValidade: produto.shelfLife !== null,
    controlaPeso: produto.tipo === 'PVAR',
    pesoVariavel: produto.tipo === 'PVAR',
    controlaNumeroSerie: false,
  };
}

export function validateConferirItemFields(
  input: ConferirItemInput,
  config: ProdutoConferenciaConfig,
): string[] {
  const errors: string[] = [];

  if (config.controlaLote && !input.loteRecebido?.trim()) {
    errors.push('Lote recebido é obrigatório para este SKU');
  }

  if (config.controlaValidade && !input.validade) {
    errors.push('Validade é obrigatória para este SKU');
  }

  if (config.pesoVariavel) {
    if (input.pesoRecebido === undefined) {
      errors.push('Peso recebido é obrigatório para este SKU');
    } else if (input.pesoRecebido <= 0) {
      errors.push('Peso recebido deve ser maior que zero');
    }
  }

  if (config.controlaNumeroSerie && !input.numeroSerie?.trim()) {
    errors.push('Número de série é obrigatório para este SKU');
  }

  return errors;
}
