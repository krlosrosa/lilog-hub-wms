import type { z } from 'zod';

import { LoteModoSchema } from '../model/configuracao-operacional/configuracao-operacional.model.js';
import type { ConferirItemInput } from '../model/recebimento/recebimento.model.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';

type LoteModo = z.infer<typeof LoteModoSchema>;

export type ProdutoConferenciaConfig = {
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  controlaNumeroSerie: boolean;
};

export function resolveProdutoConferenciaConfig(
  produto: ProdutoRecord,
  solicitarPesoPvar = true,
  exigirEtiquetaPesoVariavel = false,
): ProdutoConferenciaConfig {
  const isPvar = produto.tipo === 'PVAR' && solicitarPesoPvar;

  return {
    controlaLote: produto.categoria === 'refrigerado' || produto.categoria === 'queijo',
    controlaValidade: produto.shelfLife !== null,
    controlaPeso: isPvar,
    pesoVariavel: isPvar,
    exigirEtiquetaPesoVariavel: isPvar && exigirEtiquetaPesoVariavel,
    controlaNumeroSerie: false,
  };
}

export function validateConferirItemFields(
  input: ConferirItemInput,
  config: ProdutoConferenciaConfig,
  loteModo: LoteModo = 'lote',
): string[] {
  const errors: string[] = [];

  const exigeLote =
    config.controlaLote &&
    (loteModo === 'lote' || loteModo === 'ambos');

  const exigeValidade =
    (loteModo === 'fabricacao' || loteModo === 'ambos') &&
    (config.controlaLote || config.controlaValidade);

  if (exigeLote && !input.loteRecebido?.trim()) {
    errors.push('Lote recebido é obrigatório para este SKU');
  }

  if (exigeValidade && !input.validade) {
    errors.push('Validade/fabricação é obrigatória para este SKU');
  }

  if (
    config.controlaValidade &&
    loteModo === 'lote' &&
    !input.validade
  ) {
    errors.push('Validade é obrigatória para este SKU');
  }

  if (config.pesoVariavel) {
    if (input.pesoRecebido === undefined) {
      errors.push('Peso recebido é obrigatório para este SKU');
    } else if (input.pesoRecebido <= 0) {
      errors.push('Peso recebido deve ser maior que zero');
    }
  }

  if (config.exigirEtiquetaPesoVariavel && !input.etiquetaCodigo?.trim()) {
    errors.push('Etiqueta é obrigatória para produtos de peso variável');
  }

  if (config.controlaNumeroSerie && !input.numeroSerie?.trim()) {
    errors.push('Número de série é obrigatório para este SKU');
  }

  return errors;
}
