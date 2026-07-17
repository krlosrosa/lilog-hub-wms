import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { RecebimentoV2SyncAdapter } from '../../../src/application/usecases/sync/adapters/recebimento-v2-sync.adapter.js';
import type { IPreRecebimentoRepository } from '../../../src/domain/repositories/recebimento/pre-recebimento.repository.js';
import type { IRecebimentoRepository } from '../../../src/domain/repositories/recebimento/recebimento.repository.js';
import type { SyncApplyContext } from '../../../src/application/usecases/sync/adapters/sync-adapter.interface.js';
import type { SyncOperation } from '../../../src/domain/model/sync/sync.model.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<SyncApplyContext> = {}): SyncApplyContext {
  return {
    aggregateId: 'pre-1',
    unidadeId: 'ITB',
    userId: null,
    resourceId: 'rec-1',
    idMappings: new Map(),
    ...overrides,
  };
}

function makeOperation(type: string, payload: Record<string, unknown> = {}, overrides: Partial<SyncOperation> = {}): SyncOperation {
  return {
    opId: `op-${type}`,
    type,
    sequence: 0,
    payload,
    createdAt: Date.now(),
    dependsOn: [],
    attachments: [],
    ...overrides,
  };
}

function makePreRecebimento(unidadeId = 'ITB') {
  return {
    id: 'pre-1',
    unidadeId,
    transportadoraNome: null,
    placa: null,
    motoristaNome: null,
    motoristaTelefone: null,
    grauPrioridade: null,
    numeroOcr: null,
    numeroTransporte: null,
    origemDados: 'manual' as const,
    horarioPrevisto: new Date(),
    observacao: null,
    situacao: 'liberado_para_conferencia' as const,
    dataChegada: null,
    docaId: null,
    rastreioToken: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    itens: [],
    notasFiscais: [],
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('RecebimentoV2SyncAdapter', () => {
  let adapter: RecebimentoV2SyncAdapter;

  let preRecebimentoRepo: Partial<IPreRecebimentoRepository>;
  let recebimentoRepo: Partial<IRecebimentoRepository>;
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let iniciarRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let createChecklistRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let upsertTemperaturaProdutoRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let conferirItemUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerConferenciaItemUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerLinhaConferenciaRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerPaleteConferenciaRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let removePesagemRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let registrarAvariaUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerAvariasRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let removerAvariaRecebimentoUseCase: { execute: ReturnType<typeof vi.fn> };
  let encerrarConferenciaUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    iniciarRecebimentoUseCase = { execute: vi.fn().mockResolvedValue({ id: 'rec-1' }) };
    createChecklistRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    upsertTemperaturaProdutoRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    conferirItemUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    removerConferenciaItemUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    removerLinhaConferenciaRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    removerPaleteConferenciaRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    removePesagemRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    registrarAvariaUseCase = { execute: vi.fn().mockResolvedValue({ items: [{ id: 'avaria-1' }] }) };
    removerAvariasRecebimentoUseCase = { execute: vi.fn().mockResolvedValue(undefined) };
    removerAvariaRecebimentoUseCase = { execute: vi.fn().mockResolvedValue({ removed: true }) };
    encerrarConferenciaUseCase = { execute: vi.fn().mockResolvedValue(undefined) };

    preRecebimentoRepo = {
      findById: vi.fn().mockResolvedValue(makePreRecebimento()),
    };

    recebimentoRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'rec-1', preRecebimentoId: 'pre-1', situacao: 'em_conferencia' }),
      findByPreRecebimentoId: vi.fn().mockResolvedValue({ id: 'rec-1', preRecebimentoId: 'pre-1', situacao: 'em_conferencia' }),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 42,
        role: 'operator',
        funcionarioId: 99,
      }),
    };

    // Direct instantiation to bypass NestJS DI (class-based injection without @Inject() doesn't
    // work in vitest/esbuild which doesn't emit decorator metadata)
    adapter = new RecebimentoV2SyncAdapter(
      preRecebimentoRepo as any,
      recebimentoRepo as any,
      userRepository as any,
      iniciarRecebimentoUseCase as any,
      createChecklistRecebimentoUseCase as any,
      upsertTemperaturaProdutoRecebimentoUseCase as any,
      conferirItemUseCase as any,
      removerConferenciaItemUseCase as any,
      removerLinhaConferenciaRecebimentoUseCase as any,
      removerPaleteConferenciaRecebimentoUseCase as any,
      removePesagemRecebimentoUseCase as any,
      registrarAvariaUseCase as any,
      removerAvariasRecebimentoUseCase as any,
      removerAvariaRecebimentoUseCase as any,
      encerrarConferenciaUseCase as any,
    );
  });

  // -------------------------------------------------------------------------
  // validateAggregate
  // -------------------------------------------------------------------------

  describe('validateAggregate', () => {
    it('throws NotFoundException when preRecebimento does not exist', async () => {
      preRecebimentoRepo.findById = vi.fn().mockResolvedValue(null);

      await expect(adapter.validateAggregate('pre-1', 'ITB', null)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when unidadeId does not match', async () => {
      preRecebimentoRepo.findById = vi.fn().mockResolvedValue(makePreRecebimento('OUTRO'));

      await expect(adapter.validateAggregate('pre-1', 'ITB', null)).rejects.toThrow(NotFoundException);
    });

    it('resolves when preRecebimento exists and unidadeId matches', async () => {
      await expect(adapter.validateAggregate('pre-1', 'ITB', null)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // sortOperations
  // -------------------------------------------------------------------------

  describe('sortOperations', () => {
    it('sorts checklist (0) before items (2) before avaria-clear (2.9) before encerrar (4)', () => {
      const ops: SyncOperation[] = [
        makeOperation('recebimento.conferencia.encerrar', {}, { opId: 'op-encerrar', sequence: 4, createdAt: 4000 }),
        makeOperation('recebimento.avaria.clear', {}, { opId: 'op-clear', sequence: 3, createdAt: 3000 }),
        makeOperation('recebimento.item.conferir', {}, { opId: 'op-item', sequence: 2, createdAt: 2000 }),
        makeOperation('recebimento.checklist.upsert', {}, { opId: 'op-checklist', sequence: 1, createdAt: 1000 }),
      ];

      const sorted = adapter.sortOperations(ops);
      expect(sorted.map((o) => o.opId)).toEqual([
        'op-checklist',
        'op-item',
        'op-clear',
        'op-encerrar',
      ]);
    });

    it('sorts within same priority by sequence ASC then createdAt ASC', () => {
      const ops: SyncOperation[] = [
        makeOperation('recebimento.item.conferir', {}, { opId: 'op-c', sequence: 3, createdAt: 1000 }),
        makeOperation('recebimento.item.conferir', {}, { opId: 'op-a', sequence: 1, createdAt: 3000 }),
        makeOperation('recebimento.item.conferir', {}, { opId: 'op-b', sequence: 1, createdAt: 1000 }),
      ];

      const sorted = adapter.sortOperations(ops);
      expect(sorted.map((o) => o.opId)).toEqual(['op-b', 'op-a', 'op-c']);
    });
  });

  // -------------------------------------------------------------------------
  // apply: checklist.upsert
  // -------------------------------------------------------------------------

  describe('checklist.upsert', () => {
    it('creates recebimento when none exists and returns serverId', async () => {
      const context = makeContext({ resourceId: null });
      recebimentoRepo.findByPreRecebimentoId = vi.fn().mockResolvedValue(null);
      iniciarRecebimentoUseCase.execute = vi.fn().mockResolvedValue({ id: 'rec-new' });

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          responsavelId: 1,
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        context,
      );

      expect(result.status).toBe('applied');
      expect(result.serverId).toBe('rec-new');
      expect(iniciarRecebimentoUseCase.execute).toHaveBeenCalled();
    });

    it('falls back to user funcionarioId when responsavelId is missing from payload', async () => {
      const context = makeContext({ resourceId: null, userId: 42 });
      recebimentoRepo.findByPreRecebimentoId = vi.fn().mockResolvedValue(null);
      iniciarRecebimentoUseCase.execute = vi.fn().mockResolvedValue({ id: 'rec-new' });

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        context,
      );

      expect(result.status).toBe('applied');
      expect(userRepository.findById).toHaveBeenCalledWith(42);
      expect(iniciarRecebimentoUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ responsavelId: 99 }),
        }),
      );
    });

    it('returns retryable when user has no funcionarioId linked', async () => {
      userRepository.findById.mockResolvedValue({
        id: 42,
        role: 'operator',
        funcionarioId: null,
      });
      const context = makeContext({ resourceId: null, userId: 42 });
      recebimentoRepo.findByPreRecebimentoId = vi.fn().mockResolvedValue(null);

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        context,
      );

      expect(result.status).toBe('retryable');
      expect(iniciarRecebimentoUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns retryable when responsavelId and userId are missing', async () => {
      const context = makeContext({ resourceId: null, userId: null });
      recebimentoRepo.findByPreRecebimentoId = vi.fn().mockResolvedValue(null);

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        context,
      );

      expect(result.status).toBe('retryable');
      expect(iniciarRecebimentoUseCase.execute).not.toHaveBeenCalled();
    });

    it('uses existing recebimento when IniciarRecebimento throws ConflictException', async () => {
      const context = makeContext({ resourceId: null });
      recebimentoRepo.findByPreRecebimentoId = vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: 'rec-existing' });
      iniciarRecebimentoUseCase.execute = vi.fn().mockRejectedValue(new ConflictException('Já iniciado'));

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          responsavelId: 1,
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        context,
      );

      expect(result.status).toBe('applied');
      expect(result.serverId).toBe('rec-existing');
    });

    it('returns skipped when createChecklist throws ConflictException', async () => {
      createChecklistRecebimentoUseCase.execute = vi.fn().mockRejectedValue(
        new ConflictException('Já registrado'),
      );

      const result = await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          responsavelId: 1,
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
        }),
        makeContext(),
      );

      expect(result.status).toBe('skipped');
    });

    it('coerces string tempBau and derives photoCount from photoMediaIds', async () => {
      createChecklistRecebimentoUseCase.execute = vi.fn().mockResolvedValue({ id: 'chk-1' });

      await adapter.apply(
        makeOperation('recebimento.checklist.upsert', {
          responsavelId: 1,
          tempBau: '-18.5',
          conditions: { limpeza: true, odor: false, estrutura: true, vedacao: true },
          photoMediaIds: {
            lacre: ['p1'],
            bauFechado: ['p2'],
            bauAberto: ['p3'],
            extras: [],
          },
        }),
        makeContext(),
      );

      expect(createChecklistRecebimentoUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tempBau: -18.5,
            photoCount: 3,
          }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // apply: item.conferir
  // -------------------------------------------------------------------------

  describe('item.conferir', () => {
    it('calls ConferirItemUseCase and returns applied with serverId', async () => {
      conferirItemUseCase.execute = vi.fn().mockResolvedValue({ id: 'item-server-42' });

      const result = await adapter.apply(
        makeOperation('recebimento.item.conferir', {
          produtoId: 'PROD-1',
          quantidadeRecebida: 10,
          unidadeMedida: 'CX',
        }),
        makeContext(),
      );

      expect(conferirItemUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recebimentoId: 'rec-1',
          data: expect.objectContaining({ produtoId: 'PROD-1' }),
        }),
      );
      expect(result.status).toBe('applied');
      expect(result.serverId).toBe('item-server-42');
    });

    it('returns rejected when no recebimento exists', async () => {
      const context = makeContext({ resourceId: null });
      recebimentoRepo.findByPreRecebimentoId = vi.fn().mockResolvedValue(null);

      const result = await adapter.apply(
        makeOperation('recebimento.item.conferir', { produtoId: 'P', quantidadeRecebida: 1, unidadeMedida: 'UN' }),
        context,
      );

      expect(result.status).toBe('rejected');
    });
  });

  describe('item_linha.remove', () => {
    it('calls RemoverLinhaConferenciaRecebimentoUseCase with itemId', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.item_linha.remove', { itemId: 'item-1' }),
        makeContext(),
      );

      expect(removerLinhaConferenciaRecebimentoUseCase.execute).toHaveBeenCalledWith({
        recebimentoId: 'rec-1',
        itemId: 'item-1',
        userId: null,
      });
      expect(result.status).toBe('applied');
    });

    it('returns rejected when itemId is missing', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.item_linha.remove', { conferenceId: 'local-only' }),
        makeContext(),
      );

      expect(removerLinhaConferenciaRecebimentoUseCase.execute).not.toHaveBeenCalled();
      expect(result.status).toBe('rejected');
      expect(result.message).toContain('itemId');
    });

    it('returns skipped when linha is not found on server', async () => {
      removerLinhaConferenciaRecebimentoUseCase.execute = vi
        .fn()
        .mockRejectedValue(new NotFoundException('Linha de conferência "item-1" não encontrada neste recebimento'));

      const result = await adapter.apply(
        makeOperation('recebimento.item_linha.remove', { itemId: 'item-1' }),
        makeContext(),
      );

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Linha já removida');
    });
  });

  describe('palete.remove', () => {
    it('returns skipped when palete is not found on server', async () => {
      removerPaleteConferenciaRecebimentoUseCase.execute = vi
        .fn()
        .mockRejectedValue(
          new NotFoundException('Nenhuma linha de conferência encontrada para o palete "PLT-1"'),
        );

      const result = await adapter.apply(
        makeOperation('recebimento.palete.remove', { unitizadorCodigo: 'PLT-1' }),
        makeContext(),
      );

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Palete já removido');
    });
  });

  describe('pesagem.remove', () => {
    it('returns skipped when pesagem is not found on server', async () => {
      removePesagemRecebimentoUseCase.execute = vi
        .fn()
        .mockRejectedValue(
          new NotFoundException('Pesagem "pesagem-1" não encontrada neste recebimento'),
        );

      const result = await adapter.apply(
        makeOperation('recebimento.pesagem.remove', { pesagemId: 'pesagem-1' }),
        makeContext(),
      );

      expect(result.status).toBe('skipped');
      expect(result.message).toBe('Pesagem já removida');
    });
  });

  // -------------------------------------------------------------------------
  // apply: avaria.clear
  // -------------------------------------------------------------------------

  describe('avaria.clear', () => {
    it('calls RemoverAvariasRecebimentoUseCase and returns applied', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.avaria.clear'),
        makeContext(),
      );

      expect(removerAvariasRecebimentoUseCase.execute).toHaveBeenCalledWith({ recebimentoId: 'rec-1' });
      expect(result.status).toBe('applied');
    });
  });

  describe('avaria.registrar', () => {
    it('returns serverId from created avaria', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.avaria.registrar', {
          damageId: 'damage-local-1',
          tipo: '1',
          natureza: '1',
          causa: '1',
          quantidadeCaixas: 1,
          quantidadeUnidades: 0,
        }),
        makeContext(),
      );

      expect(registrarAvariaUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          clientDamageId: 'damage-local-1',
        }),
      );
      expect(result.status).toBe('applied');
      expect(result.serverId).toBe('avaria-1');
    });
  });

  describe('avaria.remover', () => {
    it('calls RemoverAvariaRecebimentoUseCase and returns applied', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.avaria.remover', { avariaId: 'avaria-1' }),
        makeContext(),
      );

      expect(removerAvariaRecebimentoUseCase.execute).toHaveBeenCalledWith({
        recebimentoId: 'rec-1',
        avariaId: 'avaria-1',
      });
      expect(result.status).toBe('applied');
    });

    it('returns rejected when avariaId is missing', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.avaria.remover', {}),
        makeContext(),
      );

      expect(removerAvariaRecebimentoUseCase.execute).not.toHaveBeenCalled();
      expect(result.status).toBe('rejected');
    });
  });

  // -------------------------------------------------------------------------
  // apply: conferencia.encerrar
  // -------------------------------------------------------------------------

  describe('conferencia.encerrar', () => {
    it('calls EncerrarConferenciaUseCase when situacao is em_conferencia', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.conferencia.encerrar', {
          quantidadePaletes: 8,
        }),
        makeContext(),
      );

      expect(encerrarConferenciaUseCase.execute).toHaveBeenCalledWith({
        recebimentoId: 'rec-1',
        userId: null,
        quantidadePaletes: 8,
        teveSobreposicaoCarga: false,
      });
      expect(result.status).toBe('applied');
    });

    it('returns rejected when quantidadePaletes is missing', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.conferencia.encerrar'),
        makeContext(),
      );

      expect(encerrarConferenciaUseCase.execute).not.toHaveBeenCalled();
      expect(result.status).toBe('rejected');
    });

    it('returns skipped when recebimento situacao is not em_conferencia', async () => {
      recebimentoRepo.findById = vi.fn().mockResolvedValue({
        id: 'rec-1',
        situacao: 'conferencia_encerrada',
      });

      const result = await adapter.apply(
        makeOperation('recebimento.conferencia.encerrar'),
        makeContext(),
      );

      expect(encerrarConferenciaUseCase.execute).not.toHaveBeenCalled();
      expect(result.status).toBe('skipped');
    });
  });

  // -------------------------------------------------------------------------
  // Unknown operation type
  // -------------------------------------------------------------------------

  describe('unknown operation type', () => {
    it('returns rejected for unsupported operation type', async () => {
      const result = await adapter.apply(
        makeOperation('recebimento.tipo.desconhecido'),
        makeContext(),
      );

      expect(result.status).toBe('rejected');
      expect(result.message).toContain('não suportado');
    });
  });

  // -------------------------------------------------------------------------
  // Adapter metadata
  // -------------------------------------------------------------------------

  describe('adapter metadata', () => {
    it('has correct adapter name and protocol version', () => {
      expect(adapter.adapter).toBe('recebimento-v2');
      expect(adapter.protocolVersion).toBe(2);
      expect(adapter.allowsPartialSuccess).toBe(true);
    });
  });
});
