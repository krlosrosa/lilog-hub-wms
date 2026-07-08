import { describe, expect, it } from 'vitest';

import {
  enderecoTiposCompativeisComPapel,
  enderecoTipoEsperadoParaPapel,
} from '../../../src/domain/model/produto-endereco/produto-endereco.model.js';

describe('produto-endereco.model', () => {
  describe('enderecoTipoEsperadoParaPapel', () => {
    it('returns pulmao for pulmao papel', () => {
      expect(enderecoTipoEsperadoParaPapel('pulmao')).toBe('pulmao');
    });

    it('returns picking for picking papeis', () => {
      expect(enderecoTipoEsperadoParaPapel('picking_primario')).toBe('picking');
      expect(enderecoTipoEsperadoParaPapel('picking_secundario')).toBe('picking');
    });
  });

  describe('enderecoTiposCompativeisComPapel', () => {
    it('accepts pulmao and aereo for pulmao papel', () => {
      expect(enderecoTiposCompativeisComPapel('pulmao')).toEqual([
        'pulmao',
        'aereo',
      ]);
    });

    it('accepts only picking for picking papeis', () => {
      expect(enderecoTiposCompativeisComPapel('picking_primario')).toEqual([
        'picking',
      ]);
      expect(enderecoTiposCompativeisComPapel('picking_secundario')).toEqual([
        'picking',
      ]);
    });
  });
});
