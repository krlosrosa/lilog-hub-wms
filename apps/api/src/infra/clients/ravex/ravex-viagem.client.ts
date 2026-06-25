import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { RavexHttpClient } from './ravex-http.client.js';
import { RavexApiError } from './ravex.types.js';
import {
  RavexAnomaliaViagemListEnvelopeSchema,
  RavexViagemFaturadaEnvelopeSchema,
  type RavexAnomaliaViagem,
  type RavexViagemFaturada,
} from './ravex-viagem.types.js';

@Injectable()
export class RavexViagemClient {
  private readonly logger = new Logger(RavexViagemClient.name);

  constructor(private readonly ravexHttpClient: RavexHttpClient) {}

  async getViagemPorIdentificador(
    identificador: string,
  ): Promise<RavexViagemFaturada> {
    const raw = await this.requestRavex(
      `/api/viagem-faturada/identificador/${encodeURIComponent(identificador)}`,
    );

    return this.parseViagemEnvelope(raw, `identificador ${identificador}`);
  }

  async getViagemPorId(viagemId: number): Promise<RavexViagemFaturada> {
    const raw = await this.requestRavex(`/api/viagem-faturada/${viagemId}`);

    return this.parseViagemEnvelope(raw, `id ${viagemId}`);
  }

  async listAnomalias(viagemId: number): Promise<RavexAnomaliaViagem[]> {
    const raw = await this.requestRavex(
      `/api/viagem-faturada/${viagemId}/anomalias-v2`,
    );

    const parsed = RavexAnomaliaViagemListEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para anomalias da viagem ${viagemId}: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao listar anomalias da viagem',
      );
    }

    if (!parsed.data.success) {
      const message = this.extractErrors(parsed.data.errors);
      throw new ServiceUnavailableException(
        message ||
          `A API Ravex retornou falha ao listar anomalias da viagem ${viagemId}`,
      );
    }

    return parsed.data.data ?? [];
  }

  private parseViagemEnvelope(
    raw: unknown,
    contexto: string,
  ): RavexViagemFaturada {
    const parsed = RavexViagemFaturadaEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para viagem ${contexto}: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao buscar viagem faturada',
      );
    }

    if (!parsed.data.success || !parsed.data.data) {
      const message = this.extractErrors(parsed.data.errors);
      throw new NotFoundException(
        message || `Viagem ${contexto} não encontrada na Ravex`,
      );
    }

    return parsed.data.data;
  }

  private async requestRavex(path: string): Promise<unknown> {
    try {
      return await this.ravexHttpClient.get<unknown>(path);
    } catch (error) {
      if (error instanceof RavexApiError) {
        this.logger.error(
          `Falha na Ravex ${path} (status ${error.status}): ${JSON.stringify(error.body)}`,
        );

        if (error.status === 404) {
          throw new NotFoundException(
            'Viagem não encontrada na API Ravex',
          );
        }

        throw new ServiceUnavailableException(
          `Não foi possível consultar a API Ravex (HTTP ${error.status})`,
        );
      }

      this.logger.error(`Erro de rede ao consultar Ravex ${path}`, error);

      throw new ServiceUnavailableException(
        'Não foi possível consultar a API Ravex. Verifique a conexão e tente novamente.',
      );
    }
  }

  private extractErrors(
    errors?: Array<{ key?: string | null; value?: string | null }> | null,
  ): string | null {
    if (!errors?.length) {
      return null;
    }

    return (
      errors
        .map((error) => error.value)
        .filter(Boolean)
        .join('; ') || null
    );
  }
}
