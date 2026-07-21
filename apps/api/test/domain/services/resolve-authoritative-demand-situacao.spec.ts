import { describe, expect, it } from 'vitest';

import {
  applyAuthoritativeDemandSituacao,
  resolveAuthoritativeDemandSituacao,
} from '../../../src/domain/services/resolve-authoritative-demand-situacao.js';

describe('resolveAuthoritativeDemandSituacao', () => {
  it('returns conferido when recebimento is conferido', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'em_conferencia',
        recebimentoSituacao: 'conferido',
      }),
    ).toBe('conferido');
  });

  it('returns conferido when pre-recebimento is conferido and recebimento is absent', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'conferido',
        recebimentoSituacao: null,
      }),
    ).toBe('conferido');
  });

  it('returns em_conferencia when recebimento is em_conferencia even if pre is conferido', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'conferido',
        recebimentoSituacao: 'em_conferencia',
      }),
    ).toBe('em_conferencia');
  });

  it('returns em_conferencia when either side is em_conferencia', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'liberado_para_conferencia',
        recebimentoSituacao: 'em_conferencia',
      }),
    ).toBe('em_conferencia');
  });

  it('returns impedido from pre-recebimento', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'impedido',
        recebimentoSituacao: null,
      }),
    ).toBe('impedido');
  });

  it('returns liberado_para_conferencia from pre-recebimento', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'liberado_para_conferencia',
        recebimentoSituacao: null,
      }),
    ).toBe('liberado_para_conferencia');
  });

  it('propagates agendado and aguardando from pre-recebimento', () => {
    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'agendado',
        recebimentoSituacao: null,
      }),
    ).toBe('agendado');

    expect(
      resolveAuthoritativeDemandSituacao({
        preRecebimentoSituacao: 'aguardando',
        recebimentoSituacao: null,
      }),
    ).toBe('aguardando');
  });
});

describe('applyAuthoritativeDemandSituacao', () => {
  it('mutates demand view situacao in place', () => {
    const demandView = { situacao: 'liberado_para_conferencia' };

    applyAuthoritativeDemandSituacao(demandView, {
      preRecebimentoSituacao: 'conferido',
      recebimentoSituacao: 'em_conferencia',
    });

    expect(demandView.situacao).toBe('em_conferencia');
  });
});
