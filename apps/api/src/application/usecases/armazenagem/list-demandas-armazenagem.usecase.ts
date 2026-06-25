import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
  type ListDemandasArmazenagemFilter,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';

@Injectable()
export class ListDemandasArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  execute(filter: ListDemandasArmazenagemFilter) {
    return this.armazenagemRepository.listDemandas(filter);
  }
}

@Injectable()
export class GetDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute(id: string) {
    const demanda = await this.armazenagemRepository.findDemandaById(id);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${id}" não encontrada`);
    }

    const politica = await this.armazenagemRepository.getPoliticaArmazenagem(
      demanda.unidadeId,
    );

    return { ...demanda, politica };
  }
}
