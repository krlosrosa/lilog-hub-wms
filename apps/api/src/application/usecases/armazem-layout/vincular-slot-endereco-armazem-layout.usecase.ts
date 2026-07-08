import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ARMAZEM_LAYOUT_REPOSITORY,
  type IArmazemLayoutRepository,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';

@Injectable()
export class VincularSlotEnderecoArmazemLayoutUseCase {
  constructor(
    @Inject(ARMAZEM_LAYOUT_REPOSITORY)
    private readonly armazemLayoutRepository: IArmazemLayoutRepository,
  ) {}

  async execute(input: { slotId: string; enderecoId: string | null }) {
    const slot = await this.armazemLayoutRepository.vincularSlotEndereco(
      input.slotId,
      input.enderecoId,
    );

    if (!slot) {
      throw new NotFoundException(`Slot "${input.slotId}" não encontrado`);
    }

    return {
      id: slot.id,
      elementClientKey: slot.elementClientKey,
      slotIndex: slot.slotIndex,
      nivel: slot.nivel,
      enderecoId: slot.enderecoId,
    };
  }
}
