import { Inject, Injectable } from '@nestjs/common';

import { sugerirEnderecoArmazenagem } from '../../../domain/services/sugerir-endereco-armazenagem.js';
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
import { buscarEnderecoProximoProduto } from './buscar-endereco-proximo-produto.js';
import { buscarPrimeiroEnderecoDisponivelArmazenagem } from './buscar-primeiro-endereco-disponivel-armazenagem.js';

export type PaleteParaSugestaoEndereco = {
  produtoId: string;
  sequenciaGlobal: number;
};

export type EnderecoSugeridoPalete = {
  enderecoSugeridoId: string | null;
  enderecoSugeridoLabel: string | null;
  disponivel: boolean;
  alerta: string | null;
};

@Injectable()
export class SugerirEnderecosPaletesService {
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

  async execute(
    unidadeId: string,
    paletes: PaleteParaSugestaoEndereco[],
  ): Promise<Map<number, EnderecoSugeridoPalete>> {
    const result = new Map<number, EnderecoSugeridoPalete>();
    const regras = await this.regraEnderecamentoRepository.listAtivasByUnidade(
      unidadeId,
    );

    const enderecosReservados =
      await this.armazenagemRepository.listEnderecosSugeridosReservados({
        unidadeId,
      });
    const reservados = new Set(enderecosReservados);

    const regrasParaSugestao = regras.map((regra) => ({
      id: regra.id,
      criterioTipo: regra.criterioTipo,
      criterioValor: regra.criterioValor,
      prioridade: regra.prioridade,
      destinos: regra.destinos,
    }));

    for (const palete of paletes) {
      const produto = await this.produtoRepository.findByProdutoId(
        palete.produtoId,
      );

      if (!produto) {
        result.set(palete.sequenciaGlobal, {
          enderecoSugeridoId: null,
          enderecoSugeridoLabel: null,
          disponivel: false,
          alerta: `Produto "${palete.produtoId}" não encontrado`,
        });
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
              unidadeId,
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
          unidadeId,
          [...reservados],
        );
      }

      if (!enderecoSugeridoId) {
        enderecoSugeridoId = await buscarPrimeiroEnderecoDisponivelArmazenagem(
          this.enderecoRepository,
          unidadeId,
          [...reservados],
        );
      }

      if (!enderecoSugeridoId) {
        result.set(palete.sequenciaGlobal, {
          enderecoSugeridoId: null,
          enderecoSugeridoLabel: null,
          disponivel: false,
          alerta: 'Nenhum endereço disponível para este palete',
        });
        continue;
      }

      const endereco = await this.enderecoRepository.findById(enderecoSugeridoId);

      result.set(palete.sequenciaGlobal, {
        enderecoSugeridoId,
        enderecoSugeridoLabel: endereco?.enderecoMascarado ?? null,
        disponivel: true,
        alerta: null,
      });
      reservados.add(enderecoSugeridoId);
    }

    return result;
  }
}
