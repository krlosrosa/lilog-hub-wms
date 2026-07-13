import { Inject, Injectable } from '@nestjs/common';

import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

type GetRecebimentoReferenceInput = {
  unidadeId: string;
  cursor?: string;
  userId: number | null;
};

type DocaInfo = {
  id: string;
  nome: string;
  codigo: string | null;
  ativa: boolean;
};

type GetRecebimentoReferenceResult = {
  docas: DocaInfo[];
  configuracaoConferencia: unknown;
  nextCursor: string | null;
  cachedAt: string;
};

@Injectable()
export class GetRecebimentoReferenceDataUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: GetRecebimentoReferenceInput,
  ): Promise<GetRecebimentoReferenceResult> {
    if (input.userId != null) {
      const accessible = await this.userRepository.listAccessibleUnidades(
        input.userId,
      );
      const hasAccess = accessible.some((u) => u.id === input.unidadeId);
      if (!hasAccess) {
        return {
          docas: [],
          configuracaoConferencia: null,
          nextCursor: null,
          cachedAt: new Date().toISOString(),
        };
      }
    }

    const [docasResult, configs] = await Promise.all([
      this.docaRepository.list({
        unidadeId: input.unidadeId,
        limit: 500,
      }),
      this.configuracaoOperacionalRepository.list({
        unidadeId: input.unidadeId,
        dominio: DOMINIO_RECEBIMENTO,
        categoria: CATEGORIA_CONFERENCIA,
        subtipo: SUBTIPO_PARAMETROS,
        ativo: true,
      }),
    ]);
    const config = configs.find((c) => c.isPadrao) ?? configs[0] ?? null;

    const docas: DocaInfo[] = docasResult.items.map((d) => ({
      id: d.id,
      nome: d.nome,
      codigo: d.codigo ?? null,
      ativa: d.situacao === 'disponivel',
    }));

    return {
      docas,
      configuracaoConferencia: config?.parametros ?? null,
      nextCursor: null,
      cachedAt: new Date().toISOString(),
    };
  }
}
