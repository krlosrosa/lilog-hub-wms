import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ProcessReplicachePullUseCase,
  formatReplicacheCookie,
  parseReplicacheCookieVersion,
} from '../../../src/application/usecases/replicache/process-replicache-pull.usecase.js';
import type { IReplicacheRepository } from '../../../src/domain/repositories/replicache/replicache.repository.js';
import type { BuildRecebimentoReplicacheSnapshotService } from '../../../src/application/services/replicache/build-recebimento-replicache-snapshot.service.js';

const UNIDADE_ID = 'pavuna';
const USER_ID = 42;
const CLIENT_GROUP_ID = 'client-group-1';

describe('parseReplicacheCookieVersion', () => {
  it('parses numeric cookies', () => {
    expect(parseReplicacheCookieVersion(113)).toBe(113);
    expect(parseReplicacheCookieVersion('114')).toBe(114);
  });

  it('parses legacy hash cookies', () => {
    expect(parseReplicacheCookieVersion('113:f7ffe9d5')).toBe(113);
  });

  it('returns -1 for null', () => {
    expect(parseReplicacheCookieVersion(null)).toBe(-1);
  });

  it('parses zero-padded cookies', () => {
    expect(parseReplicacheCookieVersion('z000000000999')).toBe(999);
    expect(parseReplicacheCookieVersion('z000000001000')).toBe(1000);
  });
});

describe('formatReplicacheCookie', () => {
  it('pads version so lexicographic order matches numeric order', () => {
    expect(formatReplicacheCookie(999)).toBe('z000000000999');
    expect(formatReplicacheCookie(1000)).toBe('z000000001000');
    expect(formatReplicacheCookie(1000) > formatReplicacheCookie(999)).toBe(
      true,
    );
  });

  it('sorts after legacy unpadded cookies', () => {
    expect(formatReplicacheCookie(1000) > '999').toBe(true);
    expect(formatReplicacheCookie(1000) > '113:f7ffe9d5').toBe(true);
  });
});

describe('ProcessReplicachePullUseCase', () => {
  let useCase: ProcessReplicachePullUseCase;
  let mockReplicacheRepo: {
    listClientGroupMutationIds: ReturnType<typeof vi.fn>;
    bumpSpaceVersion: ReturnType<typeof vi.fn>;
  };
  let mockSnapshotService: {
    buildSnapshot: ReturnType<typeof vi.fn>;
  };

  const samplePatch = [
    {
      op: 'put' as const,
      key: 'demand/11111111-1111-1111-1111-111111111111',
      value: { preRecebimentoId: '11111111-1111-1111-1111-111111111111' },
    },
  ];
  const samplePatchWithClear = [
    { op: 'clear' as const },
    ...samplePatch,
  ];

  beforeEach(() => {
    mockReplicacheRepo = {
      listClientGroupMutationIds: vi
        .fn()
        .mockResolvedValue({ 'client-1': 5 }),
      bumpSpaceVersion: vi.fn().mockResolvedValue(102),
    };
    mockSnapshotService = {
      buildSnapshot: vi.fn().mockResolvedValue(samplePatch),
    };

    useCase = new ProcessReplicachePullUseCase(
      mockReplicacheRepo as unknown as IReplicacheRepository,
      mockSnapshotService as unknown as BuildRecebimentoReplicacheSnapshotService,
    );
  });

  it('builds full snapshot on initial pull (cookie null)', async () => {
    const result = await useCase.execute({
      request: {
        clientGroupID: CLIENT_GROUP_ID,
        cookie: null,
        profileID: 'profile-1',
        pullVersion: 1,
        schemaVersion: 'recebimento-rc-v4',
      },
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(mockSnapshotService.buildSnapshot).toHaveBeenCalledWith({
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });
    expect(mockReplicacheRepo.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
    expect(result.cookie).toBe('z000000000102');
    expect(result.lastMutationIDChanges).toEqual({ 'client-1': 5 });
    expect(result.patch).toEqual(samplePatchWithClear);
  });

  it('always returns snapshot even when client cookie matches prior version', async () => {
    mockReplicacheRepo.bumpSpaceVersion.mockResolvedValue(114);

    const result = await useCase.execute({
      request: {
        clientGroupID: CLIENT_GROUP_ID,
        cookie: '113:f7ffe9d5',
        profileID: 'profile-1',
        pullVersion: 1,
        schemaVersion: 'recebimento-rc-v4',
      },
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(mockSnapshotService.buildSnapshot).toHaveBeenCalledWith({
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });
    expect(mockReplicacheRepo.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
    expect(result.cookie).toBe('z000000000114');
    expect(result.patch).toEqual(samplePatchWithClear);
    expect(result.lastMutationIDChanges).toEqual({ 'client-1': 5 });
  });

  it('returns snapshot and bumped cookie on manual refresh', async () => {
    mockReplicacheRepo.bumpSpaceVersion.mockResolvedValue(103);

    const result = await useCase.execute({
      request: {
        clientGroupID: CLIENT_GROUP_ID,
        cookie: '102',
        profileID: 'profile-1',
        pullVersion: 1,
        schemaVersion: 'recebimento-rc-v4',
      },
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(mockSnapshotService.buildSnapshot).toHaveBeenCalled();
    expect(mockReplicacheRepo.bumpSpaceVersion).toHaveBeenCalledWith(UNIDADE_ID);
    expect(result.cookie).toBe('z000000000103');
    expect(result.patch).toEqual(samplePatchWithClear);
    expect(result.lastMutationIDChanges).toEqual({ 'client-1': 5 });
  });

  it('returns authoritative demand situacao from snapshot patch', async () => {
    const statusMatrixPatch = [
      {
        op: 'put' as const,
        key: 'demand/11111111-1111-1111-1111-111111111111',
        value: { preRecebimentoId: '11111111-1111-1111-1111-111111111111', situacao: 'em_conferencia' },
      },
      {
        op: 'put' as const,
        key: 'demand/22222222-2222-2222-2222-222222222222',
        value: { preRecebimentoId: '22222222-2222-2222-2222-222222222222', situacao: 'conferido' },
      },
      {
        op: 'put' as const,
        key: 'demand/33333333-3333-3333-3333-333333333333',
        value: { preRecebimentoId: '33333333-3333-3333-3333-333333333333', situacao: 'liberado_para_conferencia' },
      },
    ];
    mockSnapshotService.buildSnapshot.mockResolvedValue(statusMatrixPatch);

    const result = await useCase.execute({
      request: {
        clientGroupID: CLIENT_GROUP_ID,
        cookie: null,
        profileID: 'profile-1',
        pullVersion: 1,
        schemaVersion: 'recebimento-rc-v4',
      },
      unidadeId: UNIDADE_ID,
      userId: USER_ID,
    });

    expect(result.patch).toEqual([{ op: 'clear' }, ...statusMatrixPatch]);
    expect(
      result.patch.find(
        (entry) => entry.key === 'demand/22222222-2222-2222-2222-222222222222',
      ),
    ).toMatchObject({ value: { situacao: 'conferido' } });
  });
});
