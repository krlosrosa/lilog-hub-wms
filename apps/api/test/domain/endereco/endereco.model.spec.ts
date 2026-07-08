import { describe, expect, it } from 'vitest';

import {
  CreateEnderecoInputSchema,
  buildEnderecoCodigo,
  isEnderecoTipoEstruturado,
} from '../../../src/domain/model/endereco/endereco.model.js';

const baseInput = {
  unidadeId: 'UN-SEED-001',
  zona: 'DOCA',
  tipo: 'area_operacional' as const,
  tipoEstrutura: 'piso' as const,
  larguraMm: 1200,
  alturaMm: 1500,
  profundidadeMm: 1000,
  cargaMaxKg: 1500,
};

describe('endereco.model', () => {
  describe('isEnderecoTipoEstruturado', () => {
    it('returns true for picking, pulmao and aereo', () => {
      expect(isEnderecoTipoEstruturado('picking')).toBe(true);
      expect(isEnderecoTipoEstruturado('pulmao')).toBe(true);
      expect(isEnderecoTipoEstruturado('aereo')).toBe(true);
    });

    it('returns false for operational area types', () => {
      expect(isEnderecoTipoEstruturado('area_operacional')).toBe(false);
      expect(isEnderecoTipoEstruturado('recebimento')).toBe(false);
    });
  });

  describe('buildEnderecoCodigo', () => {
    it('returns only zona when rua/posicao/nivel are empty', () => {
      expect(buildEnderecoCodigo('DOCA-1')).toBe('DOCA-1');
      expect(buildEnderecoCodigo('DOCA', '', '', '')).toBe('DOCA');
    });

    it('accepts alphanumeric segments when any detail is provided', () => {
      expect(buildEnderecoCodigo('A', 'A1', 'B2', '3')).toBe('A 0A1 00B2 03');
    });
  });

  describe('CreateEnderecoInputSchema', () => {
    it('accepts area_operacional without rua/posicao/nivel and applies defaults', () => {
      const parsed = CreateEnderecoInputSchema.parse({
        ...baseInput,
      });

      expect(parsed.rua).toBe('000');
      expect(parsed.posicao).toBe('0000');
      expect(parsed.nivel).toBe('00');
      expect(parsed.enderecoMascarado).toBe('DOCA');
    });

    it('accepts area_operacional with empty rua/posicao/nivel strings and uses compact code', () => {
      const parsed = CreateEnderecoInputSchema.parse({
        ...baseInput,
        zona: 'DOCA-1',
        rua: '',
        posicao: '',
        nivel: '',
      });

      expect(parsed.enderecoMascarado).toBe('DOCA-1');
      expect(parsed.rua).toBe('000');
      expect(parsed.posicao).toBe('0000');
      expect(parsed.nivel).toBe('00');
    });

    it('rejects picking without rua/posicao/nivel', () => {
      const result = CreateEnderecoInputSchema.safeParse({
        ...baseInput,
        tipo: 'picking',
        zona: 'A',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path[0]);
        expect(paths).toContain('rua');
        expect(paths).toContain('posicao');
        expect(paths).toContain('nivel');
      }
    });

    it('accepts alphanumeric rua/posicao/nivel for aereo', () => {
      const parsed = CreateEnderecoInputSchema.parse({
        ...baseInput,
        tipo: 'aereo',
        zona: 'A',
        rua: '003',
        posicao: '0010',
        nivel: '05',
        tipoEstrutura: 'porta-palete',
      });

      expect(parsed.enderecoMascarado).toBe('A 003 0010 05');
    });

    it('accepts alphanumeric rua/posicao/nivel for picking', () => {
      const parsed = CreateEnderecoInputSchema.parse({
        ...baseInput,
        tipo: 'picking',
        zona: 'A',
        rua: 'A1',
        posicao: 'B2',
        nivel: '3',
        tipoEstrutura: 'porta-palete',
      });

      expect(parsed.enderecoMascarado).toBe('A 0A1 00B2 03');
    });

    it('rejects rack structure for area_operacional', () => {
      const result = CreateEnderecoInputSchema.safeParse({
        ...baseInput,
        tipoEstrutura: 'porta-palete',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === 'tipoEstrutura')).toBe(true);
      }
    });

    it('rejects operational structure for picking', () => {
      const result = CreateEnderecoInputSchema.safeParse({
        ...baseInput,
        tipo: 'picking',
        zona: 'A',
        rua: '001',
        posicao: '0001',
        nivel: '01',
        tipoEstrutura: 'piso',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === 'tipoEstrutura')).toBe(true);
      }
    });

    it('accepts operational structure for area_operacional', () => {
      const parsed = CreateEnderecoInputSchema.parse({
        ...baseInput,
        tipoEstrutura: 'staging',
      });

      expect(parsed.tipoEstrutura).toBe('staging');
    });
  });
});
