import {

  BadRequestException,

  Inject,

  Injectable,

  NotFoundException,

} from '@nestjs/common';



import {

  CATEGORIA_CONFERENCIA,

  DOMINIO_RECEBIMENTO,

  ParametrosRecebimentoConferenciaSchema,

  SUBTIPO_PARAMETROS,

} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';

import {

  CONFIGURACAO_OPERACIONAL_REPOSITORY,

  type IConfiguracaoOperacionalRepository,

} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';

import {

  CONFERENCIA_REPOSITORY,

  type IConferenciaRepository,

} from '../../../domain/repositories/recebimento/conferencia.repository.js';

import type { ProdutoConferenciaConfig } from '../../../domain/services/recebimento-produto-rules.js';



const CONFERENCIA_SITUACOES = new Set([

  'liberado_para_conferencia',

  'em_conferencia',

]);



function resolveExigePaleteConferencia(controlaPalete: boolean): boolean {

  return controlaPalete;

}



function applyParametrosToItemConfig(

  config: ProdutoConferenciaConfig,

  solicitarPesoPvar: boolean,

  exigirEtiquetaPesoVariavel: boolean,

): ProdutoConferenciaConfig {

  if (!solicitarPesoPvar) {

    return {

      ...config,

      controlaPeso: false,

      pesoVariavel: false,

      exigirEtiquetaPesoVariavel: false,

    };

  }



  return {

    ...config,

    exigirEtiquetaPesoVariavel:

      config.pesoVariavel && exigirEtiquetaPesoVariavel,

  };

}



@Injectable()

export class GetConferenciaContextUseCase {

  constructor(

    @Inject(CONFERENCIA_REPOSITORY)

    private readonly conferenciaRepository: IConferenciaRepository,

    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)

    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,

  ) {}



  async execute(preRecebimentoId: string) {

    const context =

      await this.conferenciaRepository.getConferenciaContext(preRecebimentoId);



    if (!context) {

      throw new NotFoundException(

        `Pré-recebimento "${preRecebimentoId}" não encontrado`,

      );

    }



    if (!CONFERENCIA_SITUACOES.has(context.situacao)) {

      throw new BadRequestException(

        'Conferência não disponível para esta carga no momento',

      );

    }



    const configuracoes = await this.configuracaoOperacionalRepository.list({

      unidadeId: context.unidadeId,

      dominio: DOMINIO_RECEBIMENTO,

      categoria: CATEGORIA_CONFERENCIA,

      subtipo: SUBTIPO_PARAMETROS,

      ativo: true,

    });



    const configPadrao =

      configuracoes.find((item) => item.isPadrao) ?? configuracoes[0];

    const parametrosConferencia = ParametrosRecebimentoConferenciaSchema.parse(

      configPadrao?.parametros ?? {},

    );

    const exigePaleteConferencia = resolveExigePaleteConferencia(

      parametrosConferencia.controlaPalete,

    );



    const mapConfig = (config: ProdutoConferenciaConfig) =>

      applyParametrosToItemConfig(

        config,

        parametrosConferencia.solicitarPesoPvar,

        parametrosConferencia.exigirEtiquetaPesoVariavel,

      );



    return {

      ...context,

      exigePaleteConferencia,

      itens: context.itens.map((item) => ({

        ...item,

        config: mapConfig(item.config),

      })),

      conferidos: context.conferidos.map((item) => ({

        ...item,

        config: mapConfig(item.config),

      })),

    };

  }

}


