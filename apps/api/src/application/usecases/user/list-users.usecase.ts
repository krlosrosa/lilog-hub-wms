import { Inject, Injectable } from '@nestjs/common';

import type { ListUsersFilter } from '../../../domain/repositories/user/user.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  execute(filter: ListUsersFilter) {
    return this.userRepository.list(filter);
  }
}
