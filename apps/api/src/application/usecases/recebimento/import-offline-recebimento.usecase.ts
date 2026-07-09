import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';

import {
  OFFLINE_RECEBIMENTO_PLACEHOLDER,
  OfflineImportEntrySchema,
  type OfflineImportEntry,
} from '../../../domain/model/offline-import/offline-import.model.js';
import {
  CreateChecklistRecebimentoInputSchema,
} from '../../../domain/model/recebimento/recebimento.model.js';
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
import { CreateChecklistRecebimentoUseCase } from './create-checklist-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from './encerrar-conferencia.usecase.js';
import { IniciarRecebimentoUseCase } from './iniciar-recebimento.usecase.js';
import { RegistrarAvariaUseCase } from './registrar-avaria.usecase.js';
import { RemoverAvariasRecebimentoUseCase } from './remover-avarias-recebimento.usecase.js';
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

const OfflineChecklistPayloadSchema = CreateChecklistRecebimentoInputSchema.extend({
  preRecebimentoId: z.string().uuid().optional(),
  demandId: z.string().min(1).optional(),
  docaId: z.string().uuid().optional(),
  responsavelId: z.number().int().positive(),
  photoUrls: z.array(z.string()).optional(),
});

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

function getRecebimentoEntryPriority(entry: OfflineImportEntry): number {
  const endpoint = entry.endpoint.toLowerCase();
  const method = entry.method.toUpperCase();

  if (method === 'PUT' && endpoint.includes('/checklist')) {
    return 0;
  }

  if (endpoint.includes('/avarias')) {
    return method === 'DELETE' ? 2.9 : 3;
  }

  if (method === 'PUT' && endpoint.includes('/encerrar')) {
    return 4;
  }

  return 2;
}

function sortOfflineRecebimentoEntries(
  entries: OfflineImportEntry[],
): OfflineImportEntry[] {
  return [...entries].sort((left, right) => {
    const priorityDiff =
      getRecebimentoEntryPriority(left) - getRecebimentoEntryPriority(right);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return left.createdAt - right.createdAt;
  });
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

function isIdempotentImportError(error: unknown): boolean {
  if (error instanceof ConflictException) {
    return true;
  }

  if (!(error instanceof BadRequestException)) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('já iniciado') ||
    message.includes('já encerrad') ||
    message.includes('duplicad') ||
    message.includes('em andamento') ||
    message.includes('durante a conferencia') ||
    message.includes('durante a conferência')
  );
}

function isChecklistEntry(entry: OfflineImportEntry): boolean {
  const parsedEndpoint = parseRecebimentoEndpoint(entry.endpoint);
  return (
    entry.method === 'PUT' &&
    parsedEndpoint?.rest === '/checklist'
  );
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
    private readonly iniciarRecebimentoUseCase: IniciarRecebimentoUseCase,
    private readonly createChecklistRecebimentoUseCase: CreateChecklistRecebimentoUseCase,
    private readonly conferirItemUseCase: ConferirItemUseCase,
    private readonly removerConferenciaItemUseCase: RemoverConferenciaItemUseCase,
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
    private readonly removerPaleteConferenciaRecebimentoUseCase: RemoverPaleteConferenciaRecebimentoUseCase,
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
    private readonly removerAvariasRecebimentoUseCase: RemoverAvariasRecebimentoUseCase,
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

    let recebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(parsed.demandId);

    let appliedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ label: string; message: string }> = [];
    const sortedEntries = sortOfflineRecebimentoEntries(parsed.entries);

    for (const entry of sortedEntries) {
      const entryKey = buildEntryKey(entry);
      const existing = await this.offlineImportLogRepository.findByExportAndEntryKey(
        parsed.exportId,
        entryKey,
      );

      if (existing?.status === 'applied' || existing?.status === 'skipped') {
        skippedCount += 1;
        continue;
      }

      if (!recebimento && !isChecklistEntry(entry)) {
        errors.push({
          label: entry.label,
          message:
            'Pacote offline sem checklist para criar recebimento desta demanda',
        });
        continue;
      }

      try {
        const resolvedRecebimentoId =
          recebimento?.id ?? OFFLINE_RECEBIMENTO_PLACEHOLDER;

        const createdRecebimentoId = await this.applyEntry(
          entry,
          resolvedRecebimentoId,
          parsed.demandId,
          userId,
        );

        if (createdRecebimentoId) {
          recebimento =
            (await this.recebimentoRepository.findById(createdRecebimentoId)) ??
            recebimento;
        } else if (
          resolvedRecebimentoId === OFFLINE_RECEBIMENTO_PLACEHOLDER &&
          recebimento
        ) {
          // recebimento criado em passo anterior do mesmo pacote
        }

        if (!recebimento) {
          recebimento =
            await this.recebimentoRepository.findByPreRecebimentoId(
              parsed.demandId,
            );
        }

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
        if (isIdempotentImportError(error)) {
          await this.offlineImportLogRepository.create({
            exportId: parsed.exportId,
            demandId: parsed.demandId,
            entryKey,
            endpoint: entry.endpoint,
            method: entry.method,
            label: entry.label,
            status: 'skipped',
            userId,
          });
          skippedCount += 1;
          continue;
        }

        errors.push({
          label: entry.label,
          message: getErrorMessage(error),
        });
      }
    }

    if (!recebimento) {
      throw new BadRequestException(
        'Não foi possível resolver recebimento para importar dados offline desta demanda',
      );
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
    demandId: string,
    userId: number | null,
  ): Promise<string | null> {
    const parsedEndpoint = parseRecebimentoEndpoint(entry.endpoint);

    if (!parsedEndpoint) {
      throw new BadRequestException(
        `Endpoint não suportado para importação offline: ${entry.endpoint}`,
      );
    }

    const usesPlaceholder =
      parsedEndpoint.recebimentoId === OFFLINE_RECEBIMENTO_PLACEHOLDER;

    if (
      !usesPlaceholder &&
      parsedEndpoint.recebimentoId !== expectedRecebimentoId
    ) {
      throw new BadRequestException(
        'Operação offline não pertence ao recebimento desta demanda',
      );
    }

    const recebimentoId = usesPlaceholder
      ? expectedRecebimentoId === OFFLINE_RECEBIMENTO_PLACEHOLDER
        ? (
            await this.recebimentoRepository.findByPreRecebimentoId(demandId)
          )?.id ?? OFFLINE_RECEBIMENTO_PLACEHOLDER
        : expectedRecebimentoId
      : parsedEndpoint.recebimentoId;

    const rest = parsedEndpoint.rest;
    const method = entry.method;
    const payload =
      typeof entry.payload === 'object' && entry.payload !== null
        ? (entry.payload as Record<string, unknown>)
        : {};

    if (method === 'PUT' && rest === '/checklist') {
      const body = OfflineChecklistPayloadSchema.parse(payload);
      const preRecebimentoId = body.preRecebimentoId ?? body.demandId ?? demandId;

      let resolvedRecebimentoId =
        recebimentoId === OFFLINE_RECEBIMENTO_PLACEHOLDER
          ? (
              await this.recebimentoRepository.findByPreRecebimentoId(
                preRecebimentoId,
              )
            )?.id ?? null
          : recebimentoId;

      if (!resolvedRecebimentoId) {
        try {
          const created = await this.iniciarRecebimentoUseCase.execute({
            data: {
              preRecebimentoId,
              docaId: body.docaId,
              responsavelId: body.responsavelId,
            },
            userId,
          });
          resolvedRecebimentoId = created.id;
        } catch (error) {
          if (error instanceof ConflictException) {
            const existing =
              await this.recebimentoRepository.findByPreRecebimentoId(
                preRecebimentoId,
              );
            resolvedRecebimentoId = existing?.id ?? null;
          } else {
            throw error;
          }
        }
      }

      if (!resolvedRecebimentoId) {
        throw new BadRequestException(
          'Não foi possível iniciar recebimento para importar checklist offline',
        );
      }

      const photoCount =
        body.photoCount ||
        (Array.isArray(body.photoUrls) ? body.photoUrls.length : 0) ||
        entry.photoRefs?.length ||
        0;

      try {
        await this.createChecklistRecebimentoUseCase.execute({
          recebimentoId: resolvedRecebimentoId,
          data: {
            lacre: body.lacre,
            tempBau: body.tempBau,
            tempProduto: body.tempProduto,
            conditions: body.conditions,
            observacoes: body.observacoes,
            photoCount,
          },
        });
      } catch (error) {
        if (!isIdempotentImportError(error)) {
          throw error;
        }
      }

      return resolvedRecebimentoId;
    }

    if (recebimentoId === OFFLINE_RECEBIMENTO_PLACEHOLDER) {
      throw new BadRequestException(
        'Operação offline requer recebimento criado via checklist',
      );
    }

    if (method === 'POST' && rest === '/itens') {
      const body = ConferirItemPayloadSchema.parse(payload);
      await this.conferirItemUseCase.execute({
        recebimentoId,
        data: {
          ...body,
          validade: toOptionalDate(body.validade),
        },
        userId,
      });
      return null;
    }

    if (method === 'DELETE') {
      const itemMatch = rest.match(/^\/itens\/([^/?#]+)$/);
      if (itemMatch?.[1]) {
        try {
          await this.removerConferenciaItemUseCase.execute({
            recebimentoId,
            produtoId: decodeURIComponent(itemMatch[1]),
            userId,
          });
        } catch (error) {
          if (!isIdempotentImportError(error)) {
            throw error;
          }
        }
        return null;
      }

      const pesagemMatch = rest.match(/^\/pesagens\/([^/?#]+)$/);
      if (pesagemMatch?.[1]) {
        try {
          await this.removePesagemRecebimentoUseCase.execute({
            recebimentoId,
            pesagemId: decodeURIComponent(pesagemMatch[1]),
            userId,
          });
        } catch (error) {
          if (!isIdempotentImportError(error)) {
            throw error;
          }
        }
        return null;
      }

      const linhaMatch = rest.match(/^\/itens-linha\/([^/?#]+)$/);
      if (linhaMatch?.[1]) {
        try {
          await this.removerLinhaConferenciaRecebimentoUseCase.execute({
            recebimentoId,
            itemId: decodeURIComponent(linhaMatch[1]),
            userId,
          });
        } catch (error) {
          if (!isIdempotentImportError(error)) {
            throw error;
          }
        }
        return null;
      }

      const paleteMatch = rest.match(/^\/paletes\/([^/?#]+)/);
      if (paleteMatch?.[1]) {
        const queryMatch = entry.endpoint.match(/[?&]produtoId=([^&]+)/i);
        try {
          await this.removerPaleteConferenciaRecebimentoUseCase.execute({
            recebimentoId,
            unitizadorCodigo: decodeURIComponent(paleteMatch[1]),
            produtoId: queryMatch?.[1]
              ? decodeURIComponent(queryMatch[1])
              : undefined,
            userId,
          });
        } catch (error) {
          if (!isIdempotentImportError(error)) {
            throw error;
          }
        }
        return null;
      }
    }

    if (method === 'DELETE' && rest === '/avarias') {
      try {
        await this.removerAvariasRecebimentoUseCase.execute({
          recebimentoId,
        });
      } catch (error) {
        if (!isIdempotentImportError(error)) {
          throw error;
        }
      }
      return null;
    }

    if (method === 'POST' && rest === '/avarias') {
      const body = RegistrarAvariaPayloadSchema.parse(payload);
      const photoCount =
        body.photoCount ||
        (Array.isArray(body.photoUrls) ? body.photoUrls.length : 0) ||
        entry.photoRefs?.length ||
        0;

      try {
        await this.registrarAvariaUseCase.execute({
          recebimentoId,
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
      } catch (error) {
        if (!isIdempotentImportError(error)) {
          throw error;
        }
      }
      return null;
    }

    if (method === 'PUT' && rest === '/encerrar') {
      const recebimento = await this.recebimentoRepository.findById(recebimentoId);
      if (recebimento && recebimento.situacao !== 'em_conferencia') {
        return null;
      }

      try {
        await this.encerrarConferenciaUseCase.execute({
          recebimentoId,
          userId,
        });
      } catch (error) {
        if (!isIdempotentImportError(error)) {
          throw error;
        }
      }
      return null;
    }

    throw new BadRequestException(
      `Operação offline não mapeada: ${method} ${entry.endpoint}`,
    );
  }
}
