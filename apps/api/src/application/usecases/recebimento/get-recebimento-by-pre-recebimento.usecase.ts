import { Inject, Injectable, NotFoundException } from '@nestjs/common';



import {

  RECEBIMENTO_REPOSITORY,

  type IRecebimentoRepository,

} from '../../../domain/repositories/recebimento/recebimento.repository.js';



@Injectable()

export class GetRecebimentoByPreRecebimentoUseCase {

  constructor(

    @Inject(RECEBIMENTO_REPOSITORY)

    private readonly recebimentoRepository: IRecebimentoRepository,

  ) {}



  async execute(preRecebimentoId: string) {

    const recebimento =

      await this.recebimentoRepository.findByPreRecebimentoId(preRecebimentoId);



    if (!recebimento) {

      throw new NotFoundException(

        `Recebimento para pré-recebimento "${preRecebimentoId}" não encontrado`,

      );

    }



    return recebimento;

  }

}


