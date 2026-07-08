import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { CriarUploadLoteUseCase } from '../../../src/application/usecases/expedicao/criar-upload-lote.usecase.js';
import { UPLOAD_LOTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/upload-lote.repository.js';
import { TRANSPORTE_REPOSITORY } from '../../../src/domain/repositories/expedicao/transporte.repository.js';
import { PRODUTO_REPOSITORY } from '../../../src/domain/repositories/produto/produto.repository.js';

vi.mock('../../../src/application/services/expedicao/parse-remessas-xlsx.js', () => ({
  parseRemessasXlsx: vi.fn(() => [
    {
      remessa: 'NF-1',
      empresa: 'Empresa',
      codCliente: 'C1',
      cliente: 'Cliente',
      cidade: 'Cidade',
      peso: 10,
      volume: 1,
      numeroTransporte: '101',
      itens: [
        {
          sku: 'SKU-1',
          quantidade: 1,
          unidadeMedida: 'UN',
          lote: null,
          dataFabricacao: null,
        },
      ],
    },
  ]),
}));

describe('CriarUploadLoteUseCase — duplicidade de rota', () => {
  it('retorna 409 quando rota já existe na data', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CriarUploadLoteUseCase,
        {
          provide: UPLOAD_LOTE_REPOSITORY,
          useValue: { criar: vi.fn() },
        },
        {
          provide: PRODUTO_REPOSITORY,
          useValue: {
            findByCodigosRemessa: vi.fn().mockResolvedValue(
              new Map([
                [
                  'SKU-1',
                  {
                    produtoId: 'prod-1',
                    sku: 'SKU-1',
                    unidadesPorCaixa: 1,
                  },
                ],
              ]),
            ),
          },
        },
        {
          provide: TRANSPORTE_REPOSITORY,
          useValue: {
            findDuplicados: vi.fn().mockResolvedValue([
              {
                id: 't-existente',
                rota: '101',
                status: 'pendente',
                ultimoMapaLoteId: null,
              },
            ]),
          },
        },
      ],
    }).compile();

    const useCase = moduleRef.get(CriarUploadLoteUseCase);

    await expect(
      useCase.execute({
        unidadeId: 'unidade-1',
        dataReferencia: '2026-06-22',
        horarioExpectativaSaida: '2026-06-22T08:00:00.000Z',
        nomeArquivo: 'remessas.xlsx',
        arquivo: Buffer.from('fake'),
        criadoPor: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
