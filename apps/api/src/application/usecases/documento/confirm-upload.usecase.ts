import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfirmUploadInputSchema } from '../../../domain/model/documento/documento.model.js';
import type { ConfirmUploadInput } from '../../../domain/model/documento/documento.model.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  assertR2Config,
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';

export type ConfirmUploadUseCaseInput = {
  data: ConfirmUploadInput;
  userId: number | null;
};

@Injectable()
export class ConfirmUploadUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute({ data, userId }: ConfirmUploadUseCaseInput) {
    if (!this.r2Config && process.env.NODE_ENV === 'production') {
      assertR2Config(this.r2Config);
    }

    const parsed = ConfirmUploadInputSchema.parse(data);

    const pending = await this.documentoRepository.findByChave(parsed.chave);

    if (!pending) {
      throw new NotFoundException('Documento pendente não encontrado');
    }

    if (pending.status === 'deletado') {
      throw new BadRequestException('Documento foi removido');
    }

    if (pending.status === 'ativo') {
      return pending;
    }

    // O tamanho vem validado pelo Zod (int positivo) e confirmado pelo PWA após PUT bem-sucedido.
    // A validação via HEAD foi removida pois causava falha de rede entre API e storage
    // em ambientes onde o proxy PUT funciona mas o HEAD direto não alcança o endpoint.
    const activated = await this.documentoRepository.activate(parsed.chave, {
      ...parsed,
      tamanho: parsed.tamanho,
      uploadedBy: userId,
    });

    if (!activated) {
      throw new NotFoundException('Falha ao confirmar upload do documento');
    }

    return activated;
  }
}
