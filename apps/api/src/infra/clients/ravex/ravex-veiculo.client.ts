import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { RavexHttpClient } from './ravex-http.client.js';
import { RavexApiError } from './ravex.types.js';
import {
  RavexTransportadoraEntidadeEnvelopeSchema,
  RavexTipoVeiculoListEnvelopeSchema,
  RavexVeiculoListEnvelopeSchema,
  RavexVeiculoSingleEnvelopeSchema,
  type RavexTipoVeiculo,
  type RavexTransportadoraResolvida,
  type RavexVeiculo,
} from './ravex-veiculo.types.js';

@Injectable()
export class RavexVeiculoClient {
  private readonly logger = new Logger(RavexVeiculoClient.name);

  constructor(private readonly ravexHttpClient: RavexHttpClient) {}

  async listTiposVeiculo(): Promise<RavexTipoVeiculo[]> {
    const raw = await this.requestRavex('/api/tipo-veiculo');

    const parsed = RavexTipoVeiculoListEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para tipos de veículo: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao listar tipos de veículo',
      );
    }

    if (!parsed.data.success) {
      const message = this.extractErrors(parsed.data.errors);
      throw new ServiceUnavailableException(
        message ||
          'A API Ravex retornou falha ao listar tipos de veículo',
      );
    }

    return parsed.data.data ?? [];
  }

  async getVeiculoPorPlaca(placa: string): Promise<RavexVeiculo> {
    const placaNormalizada = placa.trim().toUpperCase();
    const raw = await this.requestRavex(
      `/api/veiculo/placa/${encodeURIComponent(placaNormalizada)}`,
    );

    const parsed = RavexVeiculoSingleEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para veículo placa ${placaNormalizada}: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao buscar veículo por placa',
      );
    }

    if (!parsed.data.success || !parsed.data.data) {
      const message = this.extractErrors(parsed.data.errors);
      throw new NotFoundException(
        message || `Veículo com placa ${placaNormalizada} não encontrado na Ravex`,
      );
    }

    return parsed.data.data;
  }

  async listVeiculosPorTransportadoraId(
    transportadoraId: number,
  ): Promise<RavexVeiculo[]> {
    const raw = await this.requestRavex(
      `/api/veiculo/transportadoraid/${transportadoraId}`,
    );

    const parsed = RavexVeiculoListEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para veículos da transportadora ${transportadoraId}: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao listar veículos',
      );
    }

    if (!parsed.data.success) {
      const message = this.extractErrors(parsed.data.errors);
      throw new NotFoundException(
        message ||
          'A API Ravex retornou falha ao listar veículos da transportadora',
      );
    }

    return parsed.data.data ?? [];
  }

  async getTransportadoraPorId(
    transportadoraId: number,
  ): Promise<RavexTransportadoraResolvida> {
    const veiculos = await this.listVeiculosPorTransportadoraId(transportadoraId);

    if (veiculos.length > 0) {
      const transportadora = veiculos[0]!.transportadora;

      return {
        id: transportadora.id,
        nome: transportadora.nome,
        cnpj: transportadora.cnpj,
        quantidadeVeiculos: veiculos.length,
      };
    }

    return this.getTransportadoraEntidadePorId(transportadoraId);
  }

  private async getTransportadoraEntidadePorId(
    transportadoraId: number,
  ): Promise<RavexTransportadoraResolvida> {
    const raw = await this.requestRavex(
      `/api/entidade/transportadora/${transportadoraId}`,
    );

    const parsed = RavexTransportadoraEntidadeEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      this.logger.warn(
        `Resposta inválida da Ravex para transportadora ${transportadoraId}: ${parsed.error.message}`,
      );
      throw new ServiceUnavailableException(
        'Resposta inválida da API Ravex ao buscar transportadora',
      );
    }

    if (!parsed.data.success || !parsed.data.data) {
      const message = this.extractErrors(parsed.data.errors);
      throw new NotFoundException(
        message ||
          `Transportadora ${transportadoraId} não encontrada na Ravex`,
      );
    }

    const transportadora = parsed.data.data;

    return {
      id: transportadora.id,
      nome: transportadora.nome,
      cnpj: transportadora.cnpj,
      quantidadeVeiculos: 0,
    };
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
            'Transportadora não encontrada na API Ravex',
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
