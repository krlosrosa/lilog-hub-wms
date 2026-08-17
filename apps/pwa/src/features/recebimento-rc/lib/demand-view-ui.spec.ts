import { describe, expect, it } from 'vitest';

import { resolveDemandDisplayStatus } from './demand-view-ui';

describe('resolveDemandDisplayStatus', () => {
  it('shows Aguardando sync when replicache is conferido but Dexie has pending finalization', () => {
    const status = resolveDemandDisplayStatus(
      { situacao: 'conferido' },
      {
        localFinalizationAttempted: true,
        pendingFinalizationSync: true,
        finalizacaoPayload: { quantidadePaletes: 1 },
        finalizationServerConfirmed: false,
      },
    );

    expect(status.label).toBe('Aguardando sync');
    expect(status.situacao).toBe('em_conferencia');
    expect(status.isPendingSync).toBe(true);
  });

  it('shows Conferindo when local finalization was attempted but not confirmed', () => {
    const status = resolveDemandDisplayStatus(
      { situacao: 'conferido' },
      {
        localFinalizationAttempted: true,
        pendingFinalizationSync: false,
        finalizationServerConfirmed: false,
      },
    );

    expect(status.label).toBe('Conferindo');
    expect(status.situacao).toBe('em_conferencia');
  });

  it('shows Conferido when replicache and Dexie confirm server finalization', () => {
    const status = resolveDemandDisplayStatus(
      { situacao: 'conferido' },
      {
        localFinalizationAttempted: true,
        pendingFinalizationSync: false,
        finalizacaoPayload: { quantidadePaletes: 1 },
        finalizationServerConfirmed: true,
      },
    );

    expect(status.label).toBe('Conferido');
    expect(status.situacao).toBe('conferido');
  });

  it('shows Não sincronizado when replicache is conferido but operador API is not', () => {
    const status = resolveDemandDisplayStatus(
      { situacao: 'conferido' },
      undefined,
      { serverSituacao: 'em_conferencia' },
    );

    expect(status.label).toBe('Não sincronizado');
    expect(status.situacao).toBe('em_conferencia');
    expect(status.isPendingSync).toBe(true);
  });

  it('shows Conferido when operador API says conferido but replicache is em_conferencia', () => {
    const status = resolveDemandDisplayStatus(
      { situacao: 'em_conferencia' },
      undefined,
      { serverSituacao: 'conferido' },
    );

    expect(status.label).toBe('Conferido');
    expect(status.situacao).toBe('conferido');
    expect(status.pulse).toBe(false);
  });

  it('uses default label for em_conferencia without pending flags', () => {
    const status = resolveDemandDisplayStatus({ situacao: 'em_conferencia' });

    expect(status.label).toBe('Conferindo');
    expect(status.pulse).toBe(true);
  });
});
