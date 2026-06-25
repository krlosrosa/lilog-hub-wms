import { Inject, Injectable } from '@nestjs/common';



import type { ListPreRecebimentosFilter } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';

import {

  PRE_RECEBIMENTO_REPOSITORY,

  type IPreRecebimentoRepository,

} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';



@Injectable()

export class ListPreRecebimentosUseCase {

  constructor(

    @Inject(PRE_RECEBIMENTO_REPOSITORY)

    private readonly preRecebimentoRepository: IPreRecebimentoRepository,

  ) {}



  execute(filter: ListPreRecebimentosFilter) {

    return this.preRecebimentoRepository.list(filter);

  }

}


