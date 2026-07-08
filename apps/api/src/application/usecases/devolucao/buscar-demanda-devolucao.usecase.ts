import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { BuscarDemandaDevolucaoResponseDto } from '../../dtos/devolucao/buscar-demanda-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type BuscarDemandaDevolucaoFilter,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class BuscarDemandaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    filter: BuscarDemandaDevolucaoFilter,
  ): Promise<BuscarDemandaDevolucaoResponseDto> {
    const result = await this.devolucaoRepository.buscarDemanda(filter);

    if (!result) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    return {
      id: result.id,
      codigoDemanda: result.codigoDemanda,
      status: result.status,
      observacao: result.observacao,
      placa: result.placa,
      doca: result.doca,
      cargaSegregada: result.cargaSegregada,
      paletesEsperados: result.paletesEsperados,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      concluidaAt: result.concluidaAt?.toISOString() ?? null,
      totalNfs: result.totalNfs,
      totalItens: result.totalItens,
      pesoDevolvido: result.pesoDevolvido,
      transporteId: result.transporteId,
      cliente: result.cliente,
      tiposNf: result.tiposNf,
      notasFiscais: result.notasFiscais.map((nf) => ({
        id: nf.id,
        numeroNf: nf.numeroNf,
        chaveAcesso: nf.chaveAcesso,
        tipo: nf.tipo,
        motivo: nf.motivo,
        cliente: nf.cliente,
        codCliente: nf.codCliente,
        transporteId: nf.transporteId,
        observacao: nf.observacao,
        createdAt: nf.createdAt.toISOString(),
        itens: nf.itens.map((item) => ({
          id: item.id,
          produtoId: item.produtoId,
          sku: item.sku,
          descricaoProduto: item.descricaoProduto,
          lote: item.lote,
          dataFabricacao: item.dataFabricacao
            ? String(item.dataFabricacao)
            : null,
          quantidade: item.quantidade,
          qtdConferida: item.qtdConferida,
          unidadeMedida: item.unidadeMedida,
          quantidadeNormalizadaUnidades: item.quantidadeNormalizadaUnidades,
          pesoDevolvido: item.pesoDevolvido,
          pesoVariavel: item.pesoVariavel,
          motivoItem: item.motivoItem,
          condicao: item.condicao,
          observacao: item.observacao,
          createdAt: item.createdAt.toISOString(),
        })),
      })),
      eventos: result.eventos.map((evento) => ({
        id: evento.id,
        statusAnterior: evento.statusAnterior,
        statusNovo: evento.statusNovo,
        descricao: evento.descricao,
        criadoPorUserId: evento.criadoPorUserId,
        createdAt: evento.createdAt.toISOString(),
      })),
      checklist: result.checklist
        ? {
            id: result.checklist.id,
            dock: result.checklist.dock,
            paletesRecebidos: result.checklist.paletesRecebidos,
            tempBau: result.checklist.tempBau,
            tempProduto: result.checklist.tempProduto,
            conditions: result.checklist.conditions,
            observacoes: result.checklist.observacoes,
            photoCount: result.checklist.photoCount,
            createdAt: result.checklist.createdAt.toISOString(),
            updatedAt: result.checklist.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
