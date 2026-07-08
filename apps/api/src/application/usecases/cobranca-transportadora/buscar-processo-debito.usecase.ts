import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { BuscarProcessoDebitoResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { resolveAvariaPhotoUrls } from '../../services/devolucao/resolve-avaria-photo-urls.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';

type BuscarProcessoDebitoInput = {
  processoId: string;
  unidadeId: string;
};

@Injectable()
export class BuscarProcessoDebitoUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute(
    input: BuscarProcessoDebitoInput,
  ): Promise<BuscarProcessoDebitoResponseDto> {
    const result = await this.cobrancaRepository.buscarProcessoDetalhe(
      input.processoId,
      input.unidadeId,
    );

    if (!result) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    const evidencias = await Promise.all(
      result.evidencias.map(async (evidencia) => ({
        ...evidencia,
        photoUrls: await resolveAvariaPhotoUrls(
          this.documentoRepository,
          this.r2Config,
          evidencia.photoUrls,
        ),
        createdAt: evidencia.createdAt.toISOString(),
      })),
    );

    const interacoes = await Promise.all(
      result.interacoes.map(async (interacao) => ({
        id: interacao.id,
        processoDebitoId: interacao.processoDebitoId,
        autor: interacao.autor,
        tipo: interacao.tipo,
        descricao: interacao.descricao,
        anexoChaves: interacao.anexoChaves,
        anexoUrls: await resolveAvariaPhotoUrls(
          this.documentoRepository,
          this.r2Config,
          interacao.anexoChaves,
        ),
        transportadoraId: interacao.transportadoraId,
        criadoPorUserId: interacao.criadoPorUserId,
        createdAt: interacao.createdAt.toISOString(),
      })),
    );

    return {
      id: result.id,
      unidadeId: result.unidadeId,
      demandaId: result.demandaId,
      codigoDemanda: result.codigoDemanda,
      transporteId: result.transporteId,
      transportadoraId: result.transportadoraId,
      transportadoraNome: result.transportadoraNome,
      status: result.status,
      valorTotal: result.valorTotal,
      quantidadeItens: result.quantidadeItens,
      observacao: result.observacao,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      demanda: result.demanda,
      transporte: result.transporte
        ? {
            ...result.transporte,
            mapaGeradoEm: result.transporte.mapaGeradoEm?.toISOString() ?? null,
          }
        : null,
      notasFiscais: result.notasFiscais,
      evidencias,
      registrosCorte: result.registrosCorte.map((corte) => ({
        ...corte,
        solicitadoEm: corte.solicitadoEm.toISOString(),
      })),
      mapaSeparacao: result.mapaSeparacao
        ? {
            ...result.mapaSeparacao,
            geradoEm: result.mapaSeparacao.geradoEm?.toISOString() ?? null,
          }
        : null,
      itens: result.itens.map((item) => ({
        id: item.id,
        processoDebitoId: item.processoDebitoId,
        demandaId: item.demandaId,
        notaFiscalId: item.notaFiscalId,
        itemId: item.itemId,
        avariaId: item.avariaId,
        faltaPesoId: item.faltaPesoId,
        tipo: item.tipo,
        sku: item.sku,
        descricaoProduto: item.descricaoProduto,
        lote: item.lote,
        qtdConferida: item.qtdConferida,
        quantidade: item.quantidade,
        qtdAnomalia: item.qtdAnomalia,
        pesoKg: item.pesoKg,
        pesoTotalKg: item.pesoTotalKg,
        valorUnitario: item.valorUnitario,
        valorDebito: item.valorDebito,
        motivo: item.motivo,
        observacao: item.observacao,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      eventos: result.eventos.map((evento) => ({
        id: evento.id,
        entidadeTipo: evento.entidadeTipo,
        entidadeId: evento.entidadeId,
        statusAnterior: evento.statusAnterior,
        statusNovo: evento.statusNovo,
        descricao: evento.descricao,
        criadoPorUserId: evento.criadoPorUserId,
        criadoPorNome: evento.criadoPorNome,
        createdAt: evento.createdAt.toISOString(),
      })),
      interacoes,
    };
  }
}
