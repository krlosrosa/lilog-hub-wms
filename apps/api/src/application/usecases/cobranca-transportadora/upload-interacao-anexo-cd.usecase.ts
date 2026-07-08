import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  isLocalStorageEnabled,
  putLocalObject,
} from '../../../infra/clients/r2/local-object-storage.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import { putR2Object } from '../../../infra/clients/r2/r2-presign.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

type UploadInteracaoAnexoCdInput = {
  processoDebitoId: string;
  unidadeId: string;
  nomeOriginal: string;
  mimeType: string;
  arquivo: Buffer;
  uploadedBy?: number | null;
};

@Injectable()
export class UploadInteracaoAnexoCdUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute(input: UploadInteracaoAnexoCdInput): Promise<{ chave: string }> {
    if (!input.arquivo?.length) {
      throw new BadRequestException('Arquivo vazio ou ausente');
    }

    if (input.arquivo.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Arquivo não pode exceder 10MB');
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use PDF ou imagens (JPEG, PNG, WEBP, GIF).',
      );
    }

    const processo = await this.cobrancaRepository.buscarProcessoDetalhe(
      input.processoDebitoId,
      input.unidadeId,
    );

    if (!processo) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    if (!this.r2Config && !isLocalStorageEnabled()) {
      throw new ServiceUnavailableException(
        'Armazenamento de arquivos não configurado.',
      );
    }

    const ext = extname(input.nomeOriginal) || '.bin';
    const chave = `cd/interacoes/${input.processoDebitoId}/${randomUUID()}${ext}`;

    if (this.r2Config) {
      await putR2Object(
        this.r2Config.client,
        this.r2Config.bucketName,
        chave,
        input.arquivo,
        input.mimeType,
      );
    } else {
      await putLocalObject(chave, input.arquivo);
    }

    await this.documentoRepository.createPending({
      nome: input.nomeOriginal,
      mimeType: input.mimeType,
      tamanho: input.arquivo.length,
      entidadeTipo: 'processo_debito_interacao',
      entidadeId: input.processoDebitoId,
      chave,
      uploadedBy: input.uploadedBy ?? null,
    });

    const activated = await this.documentoRepository.activate(chave, {
      chave,
      nome: input.nomeOriginal,
      mimeType: input.mimeType,
      tamanho: input.arquivo.length,
      entidadeTipo: 'processo_debito_interacao',
      entidadeId: input.processoDebitoId,
      uploadedBy: input.uploadedBy ?? null,
    });

    if (!activated) {
      throw new BadRequestException('Falha ao registrar anexo da interação');
    }

    return { chave };
  }
}
