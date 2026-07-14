import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  assertResponsavelOuApoioRecebimento,
  assertResponsavelRecebimento,
  resolveRecebimentoCapabilities,
  shouldEnforceOperatorParticipacao,
} from '../../../src/domain/services/assert-participacao-recebimento.js';

describe('assert-participacao-recebimento', () => {
  const recebimento = { responsavelId: 10 };

  describe('shouldEnforceOperatorParticipacao', () => {
    it('aplica apenas para operadores', () => {
      expect(shouldEnforceOperatorParticipacao({ role: 'operator' })).toBe(true);
      expect(shouldEnforceOperatorParticipacao({ role: 'admin' })).toBe(false);
    });
  });

  describe('assertResponsavelRecebimento', () => {
    it('permite responsável', () => {
      expect(() =>
        assertResponsavelRecebimento(recebimento, 10),
      ).not.toThrow();
    });

    it('nega apoio e terceiros', () => {
      expect(() => assertResponsavelRecebimento(recebimento, 20)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('assertResponsavelOuApoioRecebimento', () => {
    it('permite responsável', () => {
      expect(() =>
        assertResponsavelOuApoioRecebimento(recebimento, 10, [20]),
      ).not.toThrow();
    });

    it('permite apoio', () => {
      expect(() =>
        assertResponsavelOuApoioRecebimento(recebimento, 20, [20, 30]),
      ).not.toThrow();
    });

    it('nega terceiro', () => {
      expect(() =>
        assertResponsavelOuApoioRecebimento(recebimento, 99, [20]),
      ).toThrow(ForbiddenException);
    });
  });

  describe('resolveRecebimentoCapabilities', () => {
    it('responsável tem todas as permissões de gestão', () => {
      const result = resolveRecebimentoCapabilities({
        funcionarioId: 10,
        responsavelId: 10,
        apoioFuncionarioIds: [],
      });

      expect(result.papelDoUsuario).toBe('responsavel');
      expect(result.capabilities).toEqual({
        canEditChecklist: true,
        canRegistrarTemperatura: true,
        canFinalizar: true,
        canGerenciarPaletes: true,
        canConferirItens: true,
      });
    });

    it('apoio só confere itens e paletes', () => {
      const result = resolveRecebimentoCapabilities({
        funcionarioId: 20,
        responsavelId: 10,
        apoioFuncionarioIds: [20],
      });

      expect(result.papelDoUsuario).toBe('apoio');
      expect(result.capabilities).toEqual({
        canEditChecklist: false,
        canRegistrarTemperatura: false,
        canFinalizar: false,
        canGerenciarPaletes: true,
        canConferirItens: true,
      });
    });
  });
});
