import { describe, expect, it } from 'vitest';

import {
  applyOcupacaoFromSaldoToEndereco,
  resolveEffectiveEnderecoStatus,
  resolveEffectiveOcupacaoPercent,
} from '../../../src/domain/services/resolve-endereco-ocupacao-from-saldo.js';
import type { EnderecoRecord } from '../../../src/domain/repositories/endereco/endereco.repository.js';

const baseEndereco: EnderecoRecord = {
  id: '1',
  enderecoMascarado: 'A 001 0001 01',
  unidadeId: 'u1',
  unidade: {
    id: 'u1',
    nome: 'Unidade',
    cluster: 'c1',
    nomeFilial: 'Filial',
  },
  zona: 'A',
  rua: '001',
  posicao: '0001',
  nivel: '01',
  tipo: 'pulmao',
  status: 'disponivel',
  tipoEstrutura: 'porta-palete',
  larguraMm: 1200,
  alturaMm: 1500,
  profundidadeMm: 1000,
  cargaMaxKg: '1500',
  capacidadeVolume: null,
  prioridadePicking: null,
  coordenadaX: null,
  coordenadaY: null,
  coordenadaZ: null,
  observacao: null,
  vinculoSkuFixo: false,
  regraLoteUnico: false,
  permiteMisturaValidade: false,
  permiteFracionado: false,
  curvaAbc: 'B',
  ocupacaoPercent: '0',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('resolve-endereco-ocupacao-from-saldo', () => {
  it('marca endereço disponível como ocupado quando há saldo', () => {
    expect(resolveEffectiveEnderecoStatus('disponivel', 10)).toBe('ocupado');
    expect(resolveEffectiveOcupacaoPercent('0', 10)).toBe('100');
  });

  it('mantém status bloqueado mesmo com saldo', () => {
    expect(resolveEffectiveEnderecoStatus('bloqueado', 10)).toBe('bloqueado');
  });

  it('zera ocupação quando não há saldo', () => {
    const result = applyOcupacaoFromSaldoToEndereco(baseEndereco, 0);

    expect(result.status).toBe('disponivel');
    expect(result.ocupacaoPercent).toBe('0');
  });

  it('aplica ocupação derivada do saldo no endereço', () => {
    const result = applyOcupacaoFromSaldoToEndereco(baseEndereco, 25);

    expect(result.status).toBe('ocupado');
    expect(result.ocupacaoPercent).toBe('100');
  });
});
