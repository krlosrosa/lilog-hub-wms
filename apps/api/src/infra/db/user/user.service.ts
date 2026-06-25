import { Inject, Injectable } from '@nestjs/common';

import type { CreateUserInput } from '../../../domain/model/user/user.model.js';
import type { UpdateUserInput } from '../../../domain/model/user/user.model.js';
import type {
  IUserRepository,
  ListUsersFilter,
} from '../../../domain/repositories/user/user.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createUserDb } from './create-user.drizzle.js';
import {
  findActiveUserByFuncionarioIdDb,
  findUserByEmailDb,
  findUserByIdDb,
} from './find-user.drizzle.js';
import { listUserAccessibleUnidadesDb } from './list-user-accessible-unidades.drizzle.js';
import { listUsersDb } from './list-users.drizzle.js';
import {
  blockUserDb,
  blockUsersByFuncionarioIdDb,
  unblockUserDb,
  updateUserDb,
} from './update-user.drizzle.js';

@Injectable()
export class UserService implements IUserRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findByEmail(email: string) {
    return findUserByEmailDb(this.db, email);
  }

  findById(id: number) {
    return findUserByIdDb(this.db, id);
  }

  findActiveByFuncionarioId(funcionarioId: number) {
    return findActiveUserByFuncionarioIdDb(this.db, funcionarioId);
  }

  create(data: CreateUserInput) {
    return createUserDb(this.db, data);
  }

  update(id: number, data: UpdateUserInput) {
    return updateUserDb(this.db, id, data);
  }

  list(filter: ListUsersFilter) {
    return listUsersDb(this.db, filter);
  }

  block(id: number) {
    return blockUserDb(this.db, id);
  }

  unblock(id: number) {
    return unblockUserDb(this.db, id);
  }

  blockByFuncionarioId(funcionarioId: number) {
    return blockUsersByFuncionarioIdDb(this.db, funcionarioId);
  }

  listAccessibleUnidades(userId: number) {
    return listUserAccessibleUnidadesDb(this.db, userId);
  }
}
