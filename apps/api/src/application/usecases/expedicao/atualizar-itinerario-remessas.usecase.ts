import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  UPLOAD_LOTE_REPOSITORY,
  type AtualizarItinerarioRecord,
  type IUploadLoteRepository,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';

export type AtualizarItinerarioRemessasUseCaseInput = {
  uploadLoteId: string;
  itinerarios: { remessa: string; itinerario: string }[];
};

@Injectable()
export class AtualizarItinerarioRemessasUseCase {
  constructor(
    @Inject(UPLOAD_LOTE_REPOSITORY)
    private readonly uploadLoteRepository: IUploadLoteRepository,
  ) {}

  execute(
    input: AtualizarItinerarioRemessasUseCaseInput,
  ): Promise<AtualizarItinerarioRecord> {
    if (!input.uploadLoteId?.trim()) {
      throw new BadRequestException('uploadLoteId é obrigatório');
    }

    if (!input.itinerarios?.length) {
      throw new BadRequestException('itinerarios não pode ser vazio');
    }

    return this.uploadLoteRepository.atualizarItinerarios({
      uploadLoteId: input.uploadLoteId.trim(),
      itinerarios: input.itinerarios,
    });
  }
}
