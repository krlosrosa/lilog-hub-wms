import { Inject, Injectable } from '@nestjs/common';

import {
  DEVOLUCAO_REPOSITORY,
  type AtualizarStatusDemandaInput,
  type AtualizarStatusDemandaResult,
  type BuscarDemandaDevolucaoFilter,
  type BuscarDemandaDevolucaoResult,
  type CriarAlocacaoDevolucaoInput,
  type CriarDemandaDevolucaoViagemInput,
  type CriarDemandaDevolucaoViagemResult,
  type DeletarDemandaDevolucaoResult,
  type DemandaDevolucaoRecord,
  type DevolucaoAlocacaoComContexto,
  type DevolucaoAlocacaoRecord,
  type IDevolucaoRepository,
  type ListarDemandasDevolucaoFilter,
  type ListarDemandasDevolucaoResult,
  type RegistrarAvariaDevolucaoInput,
  type RegistrarAvariaDevolucaoResult,
  type DevolucaoAvariaDemandaRecord,
  type DevolucaoAvariaDetalheRecord,
  type DevolucaoFaltaPesoRecord,
  type ListarFaltasPesoFilter,
  type RegistrarConferenciaItensInput,
  type RegistrarConferenciaItensResult,
  type AtualizarFaltaPesoInput,
  type AtualizarStatusGrupoDescargaInput,
  type AtualizarStatusGrupoDescargaResult,
  type BuscarGrupoDescargaFilter,
  type BuscarGrupoDescargaResult,
  type CriarGrupoDescargaInput,
  type CriarGrupoDescargaResult,
  type ListarGruposDescargaFilter,
  type ListarGruposDescargaResult,
  type RegistrarConferenciaGrupoInput,
  type RegistrarConferenciaGrupoResult,
  type RegistrarFaltaPesoInput,
  type RegistrarFaltaPesoResult,
  type RemoverAlocacaoDevolucaoResult,
  type SalvarChecklistDevolucaoInput,
  type SalvarChecklistDevolucaoResult,
  type ValidarFaltaPesoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { atualizarStatusDemandaDevolucaoDb } from './atualizar-status-demanda-devolucao.drizzle.js';
import { buscarDemandaDevolucaoDb } from './buscar-demanda-devolucao.drizzle.js';
import { deletarDemandaDevolucaoDb } from './deletar-demanda-devolucao.drizzle.js';
import {
  criarDemandaDevolucaoViagemDb,
  findDemandaDevolucaoByCodigoDb,
} from './criar-demanda-devolucao-viagem.drizzle.js';
import { listarDemandasDevolucaoDb } from './listar-demandas-devolucao.drizzle.js';
import { criarAlocacaoDevolucaoDb } from './criar-alocacao-devolucao.drizzle.js';
import { registrarAvariaDevolucaoDb } from './criar-avaria-devolucao.drizzle.js';
import { listarAvariasDemandaDevolucaoDb } from './listar-avarias-demanda-devolucao.drizzle.js';
import { listarAvariasDetalheDemandaDb } from './listar-avarias-detalhe-demanda.drizzle.js';
import { removerAlocacaoDevolucaoDb } from './remover-alocacao-devolucao.drizzle.js';
import { listarAlocacoesPorSessaoDb } from './listar-alocacoes-por-sessao.drizzle.js';
import { registrarConferenciaItensDb } from './registrar-conferencia-itens.drizzle.js';
import { salvarChecklistDevolucaoDb } from './create-checklist-devolucao.drizzle.js';
import { criarGrupoDescargaDevolucaoDb } from './criar-grupo-descarga-devolucao.drizzle.js';
import {
  buscarGrupoDescargaDevolucaoDb,
  listarGruposDescargaDevolucaoDb,
} from './buscar-grupo-descarga-devolucao.drizzle.js';
import {
  atualizarStatusGrupoDescargaDevolucaoDb,
  registrarConferenciaGrupoDescargaDb,
} from './registrar-conferencia-grupo-descarga.drizzle.js';
import {
  listarFaltasPesoDb,
  validarFaltaPesoDb,
} from './listar-faltas-peso.drizzle.js';
import { atualizarFaltaPesoDb } from './atualizar-falta-peso.drizzle.js';
import { registrarFaltaPesoDb } from './registrar-falta-peso.drizzle.js';

@Injectable()
export class DevolucaoService implements IDevolucaoRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  findDemandaByCodigo(
    unidadeId: string,
    codigoDemanda: string,
  ): Promise<DemandaDevolucaoRecord | null> {
    return findDemandaDevolucaoByCodigoDb(this.db, unidadeId, codigoDemanda);
  }

  criarDemandaDevolucaoViagem(
    input: CriarDemandaDevolucaoViagemInput,
  ): Promise<CriarDemandaDevolucaoViagemResult> {
    return criarDemandaDevolucaoViagemDb(this.db, input);
  }

  listarDemandas(
    filter: ListarDemandasDevolucaoFilter,
  ): Promise<ListarDemandasDevolucaoResult> {
    return listarDemandasDevolucaoDb(this.db, filter);
  }

  atualizarStatus(
    demandaId: string,
    unidadeId: string,
    input: AtualizarStatusDemandaInput,
  ): Promise<AtualizarStatusDemandaResult | null> {
    return atualizarStatusDemandaDevolucaoDb(
      this.db,
      demandaId,
      unidadeId,
      input,
    );
  }

  buscarDemanda(
    filter: BuscarDemandaDevolucaoFilter,
  ): Promise<BuscarDemandaDevolucaoResult | null> {
    return buscarDemandaDevolucaoDb(this.db, filter);
  }

  deletarDemanda(
    demandaId: string,
    unidadeId: string,
  ): Promise<DeletarDemandaDevolucaoResult | null> {
    return deletarDemandaDevolucaoDb(this.db, demandaId, unidadeId);
  }

  criarAlocacao(
    input: CriarAlocacaoDevolucaoInput,
  ): Promise<DevolucaoAlocacaoRecord> {
    return criarAlocacaoDevolucaoDb(this.db, input);
  }

  removerAlocacao(
    alocacaoId: string,
    unidadeId: string,
  ): Promise<RemoverAlocacaoDevolucaoResult | null> {
    return removerAlocacaoDevolucaoDb(this.db, alocacaoId, unidadeId);
  }

  listarAlocacoesPorSessao(
    sessaoId: string,
    unidadeId: string,
  ): Promise<DevolucaoAlocacaoComContexto[]> {
    return listarAlocacoesPorSessaoDb(this.db, sessaoId, unidadeId);
  }

  registrarConferenciaItens(
    input: RegistrarConferenciaItensInput,
  ): Promise<RegistrarConferenciaItensResult | null> {
    return registrarConferenciaItensDb(this.db, input);
  }

  registrarAvaria(
    input: RegistrarAvariaDevolucaoInput,
  ): Promise<RegistrarAvariaDevolucaoResult | null> {
    return registrarAvariaDevolucaoDb(this.db, input);
  }

  listarAvariasDemanda(
    demandaId: string,
    unidadeId: string,
  ): Promise<DevolucaoAvariaDemandaRecord[]> {
    return listarAvariasDemandaDevolucaoDb(this.db, demandaId, unidadeId);
  }

  listarAvariasDetalhe(
    demandaId: string,
    unidadeId: string,
  ): Promise<DevolucaoAvariaDetalheRecord[]> {
    return listarAvariasDetalheDemandaDb(this.db, demandaId, unidadeId);
  }

  salvarChecklist(
    input: SalvarChecklistDevolucaoInput,
  ): Promise<SalvarChecklistDevolucaoResult | null> {
    return salvarChecklistDevolucaoDb(this.db, input);
  }

  registrarFaltaPeso(
    input: RegistrarFaltaPesoInput,
  ): Promise<RegistrarFaltaPesoResult | null> {
    return registrarFaltaPesoDb(this.db, input);
  }

  atualizarFaltaPeso(
    input: AtualizarFaltaPesoInput,
  ): Promise<DevolucaoFaltaPesoRecord | null> {
    return atualizarFaltaPesoDb(this.db, input);
  }

  validarFaltaPeso(
    input: ValidarFaltaPesoInput,
  ): Promise<DevolucaoFaltaPesoRecord | null> {
    return validarFaltaPesoDb(this.db, input);
  }

  listarFaltasPeso(
    filter: ListarFaltasPesoFilter,
  ): Promise<DevolucaoFaltaPesoRecord[]> {
    return listarFaltasPesoDb(this.db, filter);
  }

  criarGrupoDescarga(
    input: CriarGrupoDescargaInput,
  ): Promise<CriarGrupoDescargaResult> {
    return criarGrupoDescargaDevolucaoDb(this.db, input);
  }

  listarGruposDescarga(
    filter: ListarGruposDescargaFilter,
  ): Promise<ListarGruposDescargaResult> {
    return listarGruposDescargaDevolucaoDb(this.db, filter);
  }

  buscarGrupoDescarga(
    filter: BuscarGrupoDescargaFilter,
  ): Promise<BuscarGrupoDescargaResult | null> {
    return buscarGrupoDescargaDevolucaoDb(this.db, filter);
  }

  atualizarStatusGrupoDescarga(
    input: AtualizarStatusGrupoDescargaInput,
  ): Promise<AtualizarStatusGrupoDescargaResult | null> {
    return atualizarStatusGrupoDescargaDevolucaoDb(this.db, input);
  }

  registrarConferenciaGrupo(
    input: RegistrarConferenciaGrupoInput,
  ): Promise<RegistrarConferenciaGrupoResult | null> {
    return registrarConferenciaGrupoDescargaDb(this.db, input);
  }
}
