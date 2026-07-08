import { Inject, Injectable } from '@nestjs/common';

import type { ListarDemandasDevolucaoResponseDto } from '../../dtos/devolucao/listar-demandas-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type ListarDemandasDevolucaoFilter,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class ListarDemandasDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    filter: ListarDemandasDevolucaoFilter,
  ): Promise<ListarDemandasDevolucaoResponseDto> {
    const result = await this.devolucaoRepository.listarDemandas(filter);

    return {
      demandas: result.demandas.map((demanda) => ({
        id: demanda.id,
        codigoDemanda: demanda.codigoDemanda,
        status: demanda.status,
        observacao: demanda.observacao,
        createdAt: demanda.createdAt.toISOString(),
        updatedAt: demanda.updatedAt.toISOString(),
        concluidaAt: demanda.concluidaAt?.toISOString() ?? null,
        totalNfs: demanda.totalNfs,
        totalItens: demanda.totalItens,
        pesoDevolvido: demanda.pesoDevolvido,
        transporteId: demanda.transporteId,
        placa: demanda.placa,
        cliente: demanda.cliente,
        tiposNf: demanda.tiposNf,
        doca: demanda.doca,
        cargaSegregada: demanda.cargaSegregada,
        paletesEsperados: demanda.paletesEsperados,
        grupoDescargaId: demanda.grupoDescargaId,
        codigoGrupo: demanda.codigoGrupo,
      })),
      stats: result.stats,
    };
  }
}
