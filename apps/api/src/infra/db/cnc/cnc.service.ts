import { Inject, Injectable } from '@nestjs/common';

import type { CncOrigem } from '../../../domain/model/cnc/cnc.model.js';
import type {
  AddCncEventoInput,
  CancelarCncInput,
  ConcluirCncTratativaInput,
  CreateCncInput,
  CreateCncTratativaInput,
  EncerrarCncInput,
  ICncRepository,
  IniciarAnaliseCncInput,
  ListCncsFilter,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { addCncEventoDb } from './add-cnc-evento.drizzle.js';
import { cancelarCncDb } from './cancelar-cnc.drizzle.js';
import { concluirCncTratativaDb } from './concluir-cnc-tratativa.drizzle.js';
import { createCncDb } from './create-cnc.drizzle.js';
import { createCncTratativaDb } from './create-cnc-tratativa.drizzle.js';
import { encerrarCncDb } from './encerrar-cnc.drizzle.js';
import {
  countCncByYearDb,
  findCncByIdDb,
  findCncByOrigemDb,
} from './find-cnc.drizzle.js';
import { iniciarAnaliseCncDb } from './iniciar-analise-cnc.drizzle.js';
import {
  countCncTratativasDb,
  countCncTratativasPendentesDb,
  listCncTratativasDb,
} from './list-cnc-tratativas.drizzle.js';
import { listCncsDb } from './list-cncs.drizzle.js';

@Injectable()
export class CncService implements ICncRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreateCncInput) {
    return createCncDb(this.db, data);
  }

  findById(id: string) {
    return findCncByIdDb(this.db, id);
  }

  findByOrigem(origem: CncOrigem, origemId: string) {
    return findCncByOrigemDb(this.db, origem, origemId);
  }

  countByYear(year: number) {
    return countCncByYearDb(this.db, year);
  }

  list(filter: ListCncsFilter) {
    return listCncsDb(this.db, filter);
  }

  iniciarAnalise(id: string, data: IniciarAnaliseCncInput) {
    return iniciarAnaliseCncDb(this.db, id, data);
  }

  encerrar(id: string, data: EncerrarCncInput) {
    return encerrarCncDb(this.db, id, data);
  }

  cancelar(id: string, data: CancelarCncInput) {
    return cancelarCncDb(this.db, id, data);
  }

  addTratativa(data: CreateCncTratativaInput) {
    return createCncTratativaDb(this.db, data);
  }

  concluirTratativa(
    cncId: string,
    tratativaId: string,
    data: ConcluirCncTratativaInput,
  ) {
    return concluirCncTratativaDb(this.db, tratativaId, cncId, data);
  }

  listTratativas(cncId: string) {
    return listCncTratativasDb(this.db, cncId);
  }

  countTratativas(cncId: string) {
    return countCncTratativasDb(this.db, cncId);
  }

  countTratativasPendentes(cncId: string) {
    return countCncTratativasPendentesDb(this.db, cncId);
  }

  addEvento(data: AddCncEventoInput) {
    return addCncEventoDb(this.db, data);
  }
}
