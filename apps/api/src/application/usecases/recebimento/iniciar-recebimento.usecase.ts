import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  IniciarRecebimentoInputSchema,
  type IniciarRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type IniciarRecebimentoUseCaseInput = {
  data: IniciarRecebimentoInput;
  userId: number | null;
};

@Injectable()
export class IniciarRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ data, userId }: IniciarRecebimentoUseCaseInput) {
    const parsed = IniciarRecebimentoInputSchema.parse(data);
    const preRecebimento = await this.preRecebimentoRepository.findById(
      parsed.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${parsed.preRecebimentoId}" não encontrado`,
      );
    }

    if (preRecebimento.situacao !== 'veiculo_chegou') {
      throw new BadRequestException(
        'Recebimento só pode ser iniciado após check-in do veículo',
      );
    }

    const existingRecebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(
        parsed.preRecebimentoId,
      );

    if (existingRecebimento) {
      throw new ConflictException('Recebimento já iniciado para esta carga');
    }

    const responsavel = await this.funcionarioRepository.findById(
      parsed.responsavelId,
    );

    if (!responsavel) {
      throw new NotFoundException(
        `Funcionário "${parsed.responsavelId}" não encontrado`,
      );
    }

    if (parsed.docaId) {
      const doca = await this.docaRepository.findById(parsed.docaId);

      if (!doca) {
        throw new NotFoundException(`Doca "${parsed.docaId}" não encontrada`);
      }

      if (doca.unidadeId !== preRecebimento.unidadeId) {
        throw new BadRequestException(
          'Doca informada não pertence à unidade do pré-recebimento',
        );
      }
    }

    const unidade = await this.unidadeRepository.findById(preRecebimento.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${preRecebimento.unidadeId}" não encontrada`,
      );
    }

    const recebimento = await this.recebimentoRepository.create(
      parsed,
      userId,
      unidade.modoUnitizacaoRecebimento,
    );

    await this.preRecebimentoRepository.updateSituacao(
      parsed.preRecebimentoId,
      'em_recebimento',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_INICIADO,
      preRecebimentoId: preRecebimento.id,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        responsavelId: parsed.responsavelId,
        docaId: parsed.docaId ?? null,
      },
    });

    return recebimento;
  }
}
