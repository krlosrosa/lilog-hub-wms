import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { BuscarDocumentoCobrancaResponseDto } from '../../dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type BuscarDocumentoCobrancaInput = {
  documentoId: string;
  unidadeId: string;
};

@Injectable()
export class BuscarDocumentoCobrancaUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: BuscarDocumentoCobrancaInput,
  ): Promise<BuscarDocumentoCobrancaResponseDto> {
    const result = await this.cobrancaRepository.buscarDocumentoDetalhe(
      input.documentoId,
      input.unidadeId,
    );

    if (!result) {
      throw new NotFoundException('Documento de cobrança não encontrado.');
    }

    return {
      id: result.id,
      unidadeId: result.unidadeId,
      numeroDocumento: result.numeroDocumento,
      transportadoraId: result.transportadoraId,
      transportadoraNome: result.transportadoraNome,
      status: result.status,
      valorTotal: result.valorTotal,
      quantidadeProcessos: result.quantidadeProcessos,
      quantidadeItens: result.quantidadeItens,
      observacao: result.observacao,
      emitidoEm: result.emitidoEm?.toISOString() ?? null,
      enviadoEm: result.enviadoEm?.toISOString() ?? null,
      pagoEm: result.pagoEm?.toISOString() ?? null,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      itens: result.itens.map((item) => ({
        id: item.id,
        documentoCobrancaId: item.documentoCobrancaId,
        processoDebitoId: item.processoDebitoId,
        processoDebitoItemId: item.processoDebitoItemId,
        valorDebito: item.valorDebito,
        demandaId: item.demandaId,
        codigoDemanda: item.codigoDemanda,
        sku: item.sku,
        tipo: item.tipo,
        createdAt: item.createdAt.toISOString(),
      })),
      eventos: result.eventos.map((evento) => ({
        id: evento.id,
        entidadeTipo: evento.entidadeTipo,
        entidadeId: evento.entidadeId,
        statusAnterior: evento.statusAnterior,
        statusNovo: evento.statusNovo,
        descricao: evento.descricao,
        criadoPorUserId: evento.criadoPorUserId,
        createdAt: evento.createdAt.toISOString(),
      })),
    };
  }
}
