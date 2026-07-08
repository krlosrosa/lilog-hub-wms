import { Inject, Injectable, NotFoundException } from '@nestjs/common';



import { sugerirEnderecoArmazenagem } from '../../../domain/services/sugerir-endereco-armazenagem.js';
import { buscarEnderecoProximoProduto } from '../../services/armazenagem/buscar-endereco-proximo-produto.js';
import { buscarPrimeiroEnderecoDisponivelArmazenagem } from '../../services/armazenagem/buscar-primeiro-endereco-disponivel-armazenagem.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';

import {

  REGRA_ENDERECAMENTO_REPOSITORY,

  type IRegraEnderecamentoRepository,

} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

import {

  PRODUTO_REPOSITORY,

  type IProdutoRepository,

} from '../../../domain/repositories/produto/produto.repository.js';



export type SugerirEnderecosDemandaArmazenagemInput = {

  demandaId: string;

};



@Injectable()

export class SugerirEnderecosDemandaArmazenagemUseCase {

  constructor(

    @Inject(ARMAZENAGEM_REPOSITORY)

    private readonly armazenagemRepository: IArmazenagemRepository,

    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)

    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,

    @Inject(PRODUTO_REPOSITORY)

    private readonly produtoRepository: IProdutoRepository,

    @Inject(ENDERECO_REPOSITORY)

    private readonly enderecoRepository: IEnderecoRepository,

  ) {}



  async execute({ demandaId }: SugerirEnderecosDemandaArmazenagemInput) {

    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);



    if (!demanda) {

      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);

    }



    const regras = await this.regraEnderecamentoRepository.listAtivasByUnidade(

      demanda.unidadeId,

    );



    const enderecosReservados =

      await this.armazenagemRepository.listEnderecosSugeridosReservados({

        unidadeId: demanda.unidadeId,

      });



    const reservados = new Set(enderecosReservados);

    const regrasParaSugestao = regras.map((regra) => ({

      id: regra.id,

      criterioTipo: regra.criterioTipo,

      criterioValor: regra.criterioValor,

      prioridade: regra.prioridade,

      destinos: regra.destinos,

    }));



    const tarefas = demanda.tarefas ?? [];



    if (tarefas.length > 0) {

      for (const tarefa of tarefas) {

        if (tarefa.enderecoSugeridoId || tarefa.status === 'armazenada') {

          continue;

        }



        const itemPrincipal = tarefa.itens[0];

        if (!itemPrincipal) {

          continue;

        }



        const produto = await this.produtoRepository.findByProdutoId(

          itemPrincipal.produtoId,

        );



        if (!produto) {

          continue;

        }



        let enderecoSugeridoId: string | null = null;

        if (regras.length > 0) {
          enderecoSugeridoId = await sugerirEnderecoArmazenagem(
            {
              produtoId: produto.produtoId,
              grupo: produto.grupo,
              categoria: produto.categoria,
            },
            regrasParaSugestao,
            async ({ tipo, zona, rua, enderecoId }) =>
              this.regraEnderecamentoRepository.findEnderecoDisponivelPorRegra({
                unidadeId: demanda.unidadeId,
                tipo,
                zona,
                rua,
                enderecoId,
                excludeIds: [...reservados],
              }),
          );
        }

        if (!enderecoSugeridoId) {
          enderecoSugeridoId = await buscarEnderecoProximoProduto(
            this.enderecoRepository,
            produto.produtoId,
            demanda.unidadeId,
            [...reservados],
          );
        }

        if (!enderecoSugeridoId) {
          enderecoSugeridoId = await buscarPrimeiroEnderecoDisponivelArmazenagem(
            this.enderecoRepository,
            demanda.unidadeId,
            [...reservados],
          );
        }

        if (!enderecoSugeridoId) {
          continue;
        }

        await this.armazenagemRepository.updateEnderecoSugeridoTarefa(

          tarefa.id,

          enderecoSugeridoId,

        );

        reservados.add(enderecoSugeridoId);

      }

    } else {

      for (const item of demanda.itens) {

        if (item.enderecoSugeridoId || item.status === 'armazenado') {

          continue;

        }



        const produto = await this.produtoRepository.findByProdutoId(

          item.produtoId,

        );



        if (!produto) {

          continue;

        }



        let enderecoSugeridoId: string | null = null;

        if (regras.length > 0) {
          enderecoSugeridoId = await sugerirEnderecoArmazenagem(
            {
              produtoId: produto.produtoId,
              grupo: produto.grupo,
              categoria: produto.categoria,
            },
            regrasParaSugestao,
            async ({ tipo, zona, rua, enderecoId }) =>
              this.regraEnderecamentoRepository.findEnderecoDisponivelPorRegra({
                unidadeId: demanda.unidadeId,
                tipo,
                zona,
                rua,
                enderecoId,
                excludeIds: [...reservados],
              }),
          );
        }

        if (!enderecoSugeridoId) {
          enderecoSugeridoId = await buscarEnderecoProximoProduto(
            this.enderecoRepository,
            produto.produtoId,
            demanda.unidadeId,
            [...reservados],
          );
        }

        if (!enderecoSugeridoId) {
          enderecoSugeridoId = await buscarPrimeiroEnderecoDisponivelArmazenagem(
            this.enderecoRepository,
            demanda.unidadeId,
            [...reservados],
          );
        }

        if (!enderecoSugeridoId) {
          continue;
        }

        await this.armazenagemRepository.updateEnderecoSugeridoItem(

          item.id,

          enderecoSugeridoId,

        );

        reservados.add(enderecoSugeridoId);

      }

    }



    const refreshed = await this.armazenagemRepository.findDemandaById(demandaId);



    if (!refreshed) {

      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);

    }



    return refreshed;

  }

}


