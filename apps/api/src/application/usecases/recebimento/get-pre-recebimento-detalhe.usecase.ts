import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  IMPEDIMENTO_REPOSITORY,
  type IImpedimentoRepository,
} from '../../../domain/repositories/recebimento/impedimento.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';

@Injectable()
export class GetPreRecebimentoDetalheUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(IMPEDIMENTO_REPOSITORY)
    private readonly impedimentoRepository: IImpedimentoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(id: string) {
    const detalhe = await this.preRecebimentoRepository.findDetalheById(id);

    if (!detalhe) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    const temperaturasProduto = detalhe.recebimento
      ? await this.conferenciaRepository.listTemperaturasProduto(
          detalhe.recebimento.id,
        )
      : [];

    const impedimentoRecord =
      await this.impedimentoRepository.findByPreRecebimentoId(id);

    let impedimento: {
      id: string;
      tipo: string;
      descricao: string;
      photoCount: number;
      registradoPorId: number | null;
      registradoPorNome: string | null;
      registradoPorMatricula: string | null;
      registradoEm: string;
    } | null = null;

    if (impedimentoRecord) {
      let registradoPorNome: string | null = null;
      let registradoPorMatricula: string | null = null;

      if (impedimentoRecord.registradoPorId) {
        const funcionario = await this.funcionarioRepository.findById(
          impedimentoRecord.registradoPorId,
        );
        registradoPorNome = funcionario?.nome ?? null;
        registradoPorMatricula = funcionario?.matricula ?? null;
      }

      impedimento = {
        id: impedimentoRecord.id,
        tipo: impedimentoRecord.tipo,
        descricao: impedimentoRecord.descricao,
        photoCount: impedimentoRecord.photoCount,
        registradoPorId: impedimentoRecord.registradoPorId,
        registradoPorNome,
        registradoPorMatricula,
        registradoEm: impedimentoRecord.registradoEm.toISOString(),
      };
    }

    return {
      ...detalhe,
      temperaturasProduto: temperaturasProduto.map((item) => ({
        etapa: item.etapa,
        temperatura: item.temperatura,
        medidoEm: item.medidoEm.toISOString(),
      })),
      impedimento,
    };
  }
}
