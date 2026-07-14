import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateEscalaInput,
  CreateSessaoInput,
  IniciarSessaoPausaInput,
  UpdateSessaoFuncionarioPresencaInput,
} from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import type {
  AdicionarFuncionarioApoioInput,
  ISessaoOperacaoRepository,
  ListEquipesFilter,
  ListEscalasFilter,
  ListSessoesFilter,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { countPausasAbertasBySessaoIdDb } from './count-pausas-abertas-sessao.drizzle.js';
import { finalizarSessaoFuncionarioPausaDb } from './finalizar-sessao-funcionario-pausa.drizzle.js';
import {
  findSessaoFuncionarioByIdDb,
  findSessaoFuncionarioDb,
} from './find-sessao-funcionario.drizzle.js';

import { iniciarSessaoFuncionarioPausaDb } from './iniciar-sessao-funcionario-pausa.drizzle.js';
import { listSessaoFuncionarioPausasDb } from './list-sessao-funcionario-pausas.drizzle.js';
import { addEquipeFuncionarioDb } from './add-equipe-funcionario.drizzle.js';
import { addEquipeFuncionariosDb } from './add-equipe-funcionarios.drizzle.js';
import { createSessaoTrabalhoDb } from './create-sessao-trabalho.drizzle.js';
import { createEscalaComEquipeDb } from './create-escala-com-equipe.drizzle.js';
import { findEscalaByIdDb } from './find-escala.drizzle.js';
import { findEquipeByIdDb } from './find-equipe.drizzle.js';
import { findEquipeIdByFuncionarioIdDb } from './find-equipe-by-funcionario.drizzle.js';
import { findSessaoAbertaByEscalaDb } from './find-sessao-aberta-by-escala.drizzle.js';
import { findSessaoByIdDb } from './find-sessao-trabalho.drizzle.js';
import { listSessaoFuncionariosDb } from './list-sessao-funcionarios.drizzle.js';
import { listSessoesTrabalhoDb } from './list-sessoes-trabalho.drizzle.js';
import { listEquipeFuncionariosDb } from './list-equipe-funcionarios.drizzle.js';
import { listEquipesDb } from './list-equipes.drizzle.js';
import { removeEquipeFuncionarioDb } from './remove-equipe-funcionario.drizzle.js';
import { listEscalasDb } from './list-escalas.drizzle.js';
import {
  abrirSessaoTrabalhoDb,
  cancelarSessaoTrabalhoDb,
  encerrarSessaoTrabalhoDb,
} from './update-sessao-trabalho-status.drizzle.js';
import { updateSessaoFuncionarioPresencaDb } from './update-sessao-funcionario.drizzle.js';
import { adicionarFuncionarioApoioDb } from './adicionar-funcionario-apoio.drizzle.js';
import { encerrarFuncionarioApoioDb } from './encerrar-funcionario-apoio.drizzle.js';
import { listFuncionariosApoioCandidatosDb } from './list-funcionarios-apoio-candidatos.drizzle.js';
import { findSessaoTitularAbertaPorFuncionarioDb } from './find-sessao-titular-aberta-por-funcionario.drizzle.js';
import { findSessaoFuncionarioRecebimentoAbertaDb } from './find-sessao-funcionario-recebimento-aberta.drizzle.js';

@Injectable()
export class SessaoOperacaoService implements ISessaoOperacaoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  listEscalas(filter: ListEscalasFilter) {
    return listEscalasDb(this.db, filter);
  }

  listEquipes(filter: ListEquipesFilter) {
    return listEquipesDb(this.db, filter);
  }

  findEquipeById(id: string) {
    return findEquipeByIdDb(this.db, id);
  }

  findEquipeIdByFuncionarioId(funcionarioId: number) {
    return findEquipeIdByFuncionarioIdDb(this.db, funcionarioId);
  }

  createEscalaComEquipe(input: CreateEscalaInput) {
    return createEscalaComEquipeDb(this.db, input);
  }

  findEscalaById(id: string) {
    return findEscalaByIdDb(this.db, id);
  }

  listEquipeFuncionarios(equipeId: string) {
    return listEquipeFuncionariosDb(this.db, equipeId);
  }

  addEquipeFuncionario(equipeId: string, funcionarioId: number) {
    return addEquipeFuncionarioDb(this.db, equipeId, funcionarioId);
  }

  addEquipeFuncionarios(equipeId: string, funcionarioIds: number[]) {
    return addEquipeFuncionariosDb(this.db, equipeId, funcionarioIds);
  }

  removeEquipeFuncionario(equipeId: string, funcionarioId: number) {
    return removeEquipeFuncionarioDb(this.db, equipeId, funcionarioId);
  }

  listSessoes(filter: ListSessoesFilter) {
    return listSessoesTrabalhoDb(this.db, filter);
  }

  createSessao(input: CreateSessaoInput) {
    return createSessaoTrabalhoDb(this.db, input);
  }

  findSessaoById(id: string) {
    return findSessaoByIdDb(this.db, id);
  }

  findSessaoAbertaByEscalaId(escalaId: string) {
    return findSessaoAbertaByEscalaDb(this.db, escalaId);
  }

  abrirSessao(id: string, userId: number) {
    return abrirSessaoTrabalhoDb(this.db, id, userId);
  }

  encerrarSessao(id: string, userId: number) {
    return encerrarSessaoTrabalhoDb(this.db, id, userId);
  }

  cancelarSessao(id: string) {
    return cancelarSessaoTrabalhoDb(this.db, id);
  }

  listSessaoFuncionarios(sessaoId: string) {
    return listSessaoFuncionariosDb(this.db, sessaoId);
  }

  updateSessaoFuncionarioPresenca(
    sessaoId: string,
    funcionarioId: number,
    input: UpdateSessaoFuncionarioPresencaInput,
  ) {
    return updateSessaoFuncionarioPresencaDb(
      this.db,
      sessaoId,
      funcionarioId,
      input,
    );
  }

  findSessaoFuncionario(sessaoId: string, funcionarioId: number) {
    return findSessaoFuncionarioDb(this.db, sessaoId, funcionarioId);
  }

  findSessaoFuncionarioById(sessaoId: string, sessaoFuncionarioId: string) {
    return findSessaoFuncionarioByIdDb(
      this.db,
      sessaoId,
      sessaoFuncionarioId,
    );
  }

  listSessaoFuncionarioPausas(sessaoId: string, funcionarioId: number) {
    return listSessaoFuncionarioPausasDb(this.db, sessaoId, funcionarioId);
  }

  async iniciarSessaoFuncionarioPausa(
    sessaoId: string,
    funcionarioId: number,
    userId: number,
    input: IniciarSessaoPausaInput,
  ) {
    const funcionario = await findSessaoFuncionarioDb(
      this.db,
      sessaoId,
      funcionarioId,
    );

    if (!funcionario) {
      throw new Error('Funcionário não encontrado na sessão');
    }

    return iniciarSessaoFuncionarioPausaDb(
      this.db,
      funcionario.id,
      userId,
      input,
    );
  }

  async finalizarSessaoFuncionarioPausa(
    sessaoId: string,
    funcionarioId: number,
    _userId: number,
  ) {
    const funcionario = await findSessaoFuncionarioDb(
      this.db,
      sessaoId,
      funcionarioId,
    );

    if (!funcionario) {
      throw new Error('Funcionário não encontrado na sessão');
    }

    const pausa = await finalizarSessaoFuncionarioPausaDb(
      this.db,
      funcionario.id,
    );

    if (!pausa) {
      throw new Error('Não há pausa em andamento para este funcionário');
    }

    return pausa;
  }

  countPausasAbertasBySessaoId(sessaoId: string) {
    return countPausasAbertasBySessaoIdDb(this.db, sessaoId);
  }

  adicionarFuncionarioApoio(input: AdicionarFuncionarioApoioInput) {
    return adicionarFuncionarioApoioDb(this.db, input);
  }

  encerrarFuncionarioApoio(
    sessaoId: string,
    sessaoFuncionarioId: string,
    userId: number,
  ) {
    return encerrarFuncionarioApoioDb(
      this.db,
      sessaoId,
      sessaoFuncionarioId,
      userId,
    );
  }

  listFuncionariosApoioCandidatos(unidadeId: string, sessaoDestinoId: string) {
    return listFuncionariosApoioCandidatosDb(
      this.db,
      unidadeId,
      sessaoDestinoId,
    );
  }

  findSessaoTitularAbertaPorFuncionario(
    unidadeId: string,
    funcionarioId: number,
    excludeSessaoId?: string,
  ) {
    return findSessaoTitularAbertaPorFuncionarioDb(
      this.db,
      unidadeId,
      funcionarioId,
      excludeSessaoId,
    );
  }

  findSessaoFuncionarioRecebimentoAberta(
    unidadeId: string,
    funcionarioId: number,
  ) {
    return findSessaoFuncionarioRecebimentoAbertaDb(
      this.db,
      unidadeId,
      funcionarioId,
    );
  }
}
