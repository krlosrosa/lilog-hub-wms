import { createHash } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';

import {
  OfflineImportEntrySchema,
  type OfflineImportEntry,
} from '../../../domain/model/offline-import/offline-import.model.js';
import {
  OFFLINE_IMPORT_LOG_REPOSITORY,
  type IOfflineImportLogRepository,
} from '../../../domain/repositories/offline-import/offline-import-log.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { ConferirItemUseCase } from './conferir-item.usecase.js';
import { EncerrarConferenciaUseCase } from './encerrar-conferencia.usecase.js';
import { RegistrarAvariaUseCase } from './registrar-avaria.usecase.js';
import { RemoverConferenciaItemUseCase } from './remover-conferencia-item.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from './remover-linha-conferencia-recebimento.usecase.js';
import { RemoverPaleteConferenciaRecebimentoUseCase } from './remover-palete-conferencia-recebimento.usecase.js';
import { RemovePesagemRecebimentoUseCase } from './remove-pesagem-recebimento.usecase.js';

export const ImportOfflineRecebimentoInputSchema = z.object({
  demandId: z.string().min(1),
  exportId: z.string().min(1).max(64),
  unidadeId: z.string().min(1).optional(),
  entries: z.array(OfflineImportEntrySchema).min(1),
});

export type ImportOfflineRecebimentoInput = z.infer<
  typeof ImportOfflineRecebimentoInputSchema
>;

export type ImportOfflineRecebimentoResult = {
  demandId: string;
  recebimentoId: string;
  exportId: string;
  appliedCount: number;
  skippedCount: number;
  errors: Array<{ label: string; message: string }>;
};

type ImportOfflineRecebimentoUseCaseInput = {
  data: ImportOfflineRecebimentoInput;
  userId: number | null;
};

const ConferirItemPayloadSchema = z.object({
  produtoId: z.string().min(1).max(50),
  quantidadeRecebida: z.number().nonnegative(),
  unidadeMedida: z.string().min(1).max(20),
  loteRecebido: z.string().optional(),
  pesoRecebido: z.number().positive().optional(),
  etiquetaCodigo: z.string().min(1).max(100).optional(),
  validade: z.union([z.iso.datetime(), z.coerce.date()]).optional(),
  numeroSerie: z.string().optional(),
  unitizadorCodigo: z.string().min(1).optional(),
});

const RegistrarAvariaPayloadSchema = z
  .object({
    produtoId: z.string().min(1).max(50).optional(),
    lote: z.string().min(1).max(100).optional(),
    validade: z.union([z.iso.datetime(), z.coerce.date()]).optional(),
    numeroSerie: z.string().min(1).max(100).optional(),
    tipo: z.string().min(1),
    natureza: z.string().min(1),
    causa: z.string().min(1),
    quantidadeCaixas: z.coerce.number().int().min(0),
    quantidadeUnidades: z.coerce.number().int().min(0),
    photoCount: z.coerce.number().int().min(0).optional().default(0),
    photoUrls: z.array(z.string()).optional(),
    replicarParaTodos: z.boolean().optional(),
    skusAlvo: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0,
    {
      message: 'Informe caixas e/ou unidades avariadas',
      path: ['quantidadeUnidades'],
    },
  );

function buildEntryKey(entry: OfflineImportEntry): string {
  const raw = JSON.stringify({
    outboxId: entry.outboxId ?? null,
    endpoint: entry.endpoint,
    method: entry.method,
    createdAt: entry.createdAt,
    payload: entry.payload,
  });

  return createHash('sha256').update(raw).digest('hex').slice(0, 64);
}

function parseRecebimentoEndpoint(endpoint: string): {
  recebimentoId: string;
  rest: string;
} | null {
  const match = endpoint
    .trim()
    .match(/^\/recebimentos\/([^/?#]+)(\/.*)?(?:\?.*)?$/i);

  if (!match?.[1]) return null;

  return {
    recebimentoId: decodeURIComponent(match[1]),
    rest: match[2] ?? '',
  };
}

function toOptionalDate(
  value: string | Date | undefined,
): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Falha ao aplicar operação offline';
}

@Injectable()
export class ImportOfflineRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(OFFLINE_IMPORT_LOG_REPOSITORY)
    private readonly offlineImportLogRepository: IOfflineImportLogRepository,
    private readonly conferirItemUseCase: ConferirItemUseCase,
    private readonly removerConferenciaItemUseCase: RemoverConferenciaItemUseCase,
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
    private readonly removerPaleteConferenciaRecebimentoUseCase: RemoverPaleteConferenciaRecebimentoUseCase,
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
    private readonly encerrarConferenciaUseCase: EncerrarConferenciaUseCase,
  ) {}

  async execute({
    data,
    userId,
  }: ImportOfflineRecebimentoUseCaseInput): Promise<ImportOfflineRecebimentoResult> {
    const parsed = ImportOfflineRecebimentoInputSchema.parse(data);

    const preRecebimento = await this.preRecebimentoRepository.findById(
      parsed.demandId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${parsed.demandId}" não encontrado`,
      );
    }

    if (
      parsed.unidadeId &&
      preRecebimento.unidadeId !== parsed.unidadeId
    ) {
      throw new BadRequestException(
        'Unidade do pacote offline não corresponde à demanda',
      );
    }

    const recebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(parsed.demandId);

    if (!recebimento) {
      throw new BadRequestException(
        'Não há recebimento ativo vinculado a esta demanda para importar dados offline',
      );
    }

    let appliedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ label: string; message: string }> = [];

    for (const entry of parsed.entries) {
      const entryKey = buildEntryKey(entry);
      const existing = await this.offlineImportLogRepository.findByExportAndEntryKey(
        parsed.exportId,
        entryKey,
      );

      if (existing?.status === 'applied' || existing?.status === 'skipped') {
        skippedCount += 1;
        continue;
      }

      try {
        await this.applyEntry(entry, recebimento.id, userId);

        await this.offlineImportLogRepository.create({
          exportId: parsed.exportId,
          demandId: parsed.demandId,
          entryKey,
          endpoint: entry.endpoint,
          method: entry.method,
          label: entry.label,
          status: 'applied',
          userId,
        });

        appliedCount += 1;
      } catch (error) {
        errors.push({
          label: entry.label,
          message: getErrorMessage(error),
        });
      }
    }

    return {
      demandId: parsed.demandId,
      recebimentoId: recebimento.id,
      exportId: parsed.exportId,
      appliedCount,
      skippedCount,
      errors,
    };
  }

  private async applyEntry(
    entry: OfflineImportEntry,
    expectedRecebimentoId: string,
    userId: number | null,
  ): Promise<void> {
    const parsedEndpoint = parseRecebimentoEndpoint(entry.endpoint);

    if (!parsedEndpoint) {
      throw new BadRequestException(
        `Endpoint não suportado para importação offline: ${entry.endpoint}`,
      );
    }

    if (parsedEndpoint.recebimentoId !== expectedRecebimentoId) {
      throw new BadRequestException(
        'Operação offline não pertence ao recebimento desta demanda',
      );
    }

    const rest = parsedEndpoint.rest;
    const method = entry.method;
    const payload =
      typeof entry.payload === 'object' && entry.payload !== null
        ? (entry.payload as Record<string, unknown>)
        : {};

    if (method === 'POST' && rest === '/itens') {
      const body = ConferirItemPayloadSchema.parse(payload);
      await this.conferirItemUseCase.execute({
        recebimentoId: expectedRecebimentoId,
        data: {
          ...body,
          validade: toOptionalDate(body.validade),
        },
        userId,
      });
      return;
    }

    if (method === 'DELETE') {
      const itemMatch = rest.match(/^\/itens\/([^/?#]+)$/);
      if (itemMatch?.[1]) {
        await this.removerConferenciaItemUseCase.execute({
          recebimentoId: expectedRecebimentoId,
          produtoId: decodeURIComponent(itemMatch[1]),
          userId,
        });
        return;
      }

      const pesagemMatch = rest.match(/^\/pesagens\/([^/?#]+)$/);
      if (pesagemMatch?.[1]) {
        await this.removePesagemRecebimentoUseCase.execute({
          recebimentoId: expectedRecebimentoId,
          pesagemId: decodeURIComponent(pesagemMatch[1]),
          userId,
        });
        return;
      }

      const linhaMatch = rest.match(/^\/itens-linha\/([^/?#]+)$/);
      if (linhaMatch?.[1]) {
        await this.removerLinhaConferenciaRecebimentoUseCase.execute({
          recebimentoId: expectedRecebimentoId,
          itemId: decodeURIComponent(linhaMatch[1]),
          userId,
        });
        return;
      }

      const paleteMatch = rest.match(/^\/paletes\/([^/?#]+)/);
      if (paleteMatch?.[1]) {
        const queryMatch = entry.endpoint.match(/[?&]produtoId=([^&]+)/i);
        await this.removerPaleteConferenciaRecebimentoUseCase.execute({
          recebimentoId: expectedRecebimentoId,
          unitizadorCodigo: decodeURIComponent(paleteMatch[1]),
          produtoId: queryMatch?.[1]
            ? decodeURIComponent(queryMatch[1])
            : undefined,
          userId,
        });
        return;
      }
    }

    if (method === 'POST' && rest === '/avarias') {
      const body = RegistrarAvariaPayloadSchema.parse(payload);
      const photoCount =
        body.photoCount ||
        (Array.isArray(body.photoUrls) ? body.photoUrls.length : 0) ||
        entry.photoRefs?.length ||
        0;

      await this.registrarAvariaUseCase.execute({
        recebimentoId: expectedRecebimentoId,
        produtoId: body.produtoId,
        lote: body.lote,
        validade: toOptionalDate(body.validade),
        numeroSerie: body.numeroSerie,
        tipo: body.tipo,
        natureza: body.natureza,
        causa: body.causa,
        quantidadeCaixas: body.quantidadeCaixas,
        quantidadeUnidades: body.quantidadeUnidades,
        photoCount,
        replicarParaTodos: body.replicarParaTodos,
        skusAlvo: body.skusAlvo,
        operatorId: userId ?? 0,
      });
      return;
    }

    if (method === 'PUT' && rest === '/encerrar') {
      await this.encerrarConferenciaUseCase.execute({
        recebimentoId: expectedRecebimentoId,
        userId,
      });
      return;
    }

    throw new BadRequestException(
      `Operação offline não mapeada: ${method} ${entry.endpoint}`,
    );
  }
}
