import {

  BadRequestException,

  Inject,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { z } from 'zod';



import {

  attachSaldoEsperadoToEnderecos,

  resolveSaldoEsperadoLinha,

} from '../../services/inventario/attach-saldo-esperado-enderecos.js';

import { calcularQuantidadeContadaUnidades } from '../../services/inventario/calcular-quantidade-contagem.js';
import { reconciliarDivergenciaRecontagem } from '../../services/inventario/reconciliar-divergencia-recontagem.js';
import { enderecosConferem } from '../../../domain/model/inventario/inventario.model.js';

import type {

  SubmitContagemAvariaInput,

  SubmitContagemCegaInput,

  SubmitContagemValidacaoInput,

} from '../../../domain/model/inventario/inventario.model.js';

import {

  ESTOQUE_REPOSITORY,

  type IEstoqueRepository,

} from '../../../domain/repositories/estoque/estoque.repository.js';

import {

  INVENTARIO_REPOSITORY,

  type IInventarioRepository,

} from '../../../domain/repositories/inventario/inventario.repository.js';

import {

  PRODUTO_REPOSITORY,

  type IProdutoRepository,

} from '../../../domain/repositories/produto/produto.repository.js';



@Injectable()

export class ListContagemDemandsUseCase {

  constructor(

    @Inject(INVENTARIO_REPOSITORY)

    private readonly inventarioRepository: IInventarioRepository,

  ) {}



  execute() {

    return this.inventarioRepository.listAllContagemDemandas();

  }

}



@Injectable()

export class ListDemandaEnderecosUseCase {

  constructor(

    @Inject(INVENTARIO_REPOSITORY)

    private readonly inventarioRepository: IInventarioRepository,

    @Inject(ESTOQUE_REPOSITORY)

    private readonly estoqueRepository: IEstoqueRepository,

  ) {}



  async execute(demandaId: string) {

    const parsedId = z.uuid().safeParse(demandaId);

    if (!parsedId.success) {

      throw new BadRequestException(`ID de demanda inválido: "${demandaId}"`);

    }



    const demanda = await this.inventarioRepository.findDemandaById(demandaId);



    if (!demanda) {

      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);

    }



    const enderecos =

      await this.inventarioRepository.listDemandaEnderecos(demandaId);



    if (demanda.tipo !== 'validacao') {

      return enderecos;

    }



    return attachSaldoEsperadoToEnderecos(this.estoqueRepository, enderecos);

  }

}



@Injectable()

export class SubmitContagemCegaUseCase {

  constructor(

    @Inject(INVENTARIO_REPOSITORY)

    private readonly inventarioRepository: IInventarioRepository,

    @Inject(PRODUTO_REPOSITORY)

    private readonly produtoRepository: IProdutoRepository,

    @Inject(ESTOQUE_REPOSITORY)

    private readonly estoqueRepository: IEstoqueRepository,

  ) {}



  async execute(input: SubmitContagemCegaInput) {

    const item = await this.inventarioRepository.findDemandaEnderecoById(

      input.demandaId,

      input.demandaEnderecoId,

    );



    if (!item) {

      throw new NotFoundException('Endereço da demanda não encontrado');

    }



    if (!enderecosConferem(input.enderecoArmazenagem, item.enderecoMascarado)) {

      throw new BadRequestException(

        'Endereço não confere com o designado. Verifique e escaneie novamente.',

      );

    }



    if (item.status === 'pendente') {

      await this.inventarioRepository.markDemandaEnderecoEmAndamento(

        item.id,

      );

    }



    if (input.enderecoVazio) {

      return this.inventarioRepository.submitContagemCega({

        ...input,

        codigoProduto: 'N/A',

        quantidadeCaixas: 0,

        quantidadeUnidades: 0,

        enderecoVazio: true,

      });

    }



    const produto = await this.produtoRepository.resolvePorCodigo(

      input.codigoProduto!,

    );

    if (!produto) {

      throw new BadRequestException(

        'SKU ou código de barras não encontrado. Verifique e escaneie novamente.',

      );

    }



    if (input.quantidadeCaixas <= 0 && input.quantidadeUnidades <= 0) {

      throw new BadRequestException('Informe caixas ou unidades');

    }



    const [itemComSaldo] = await attachSaldoEsperadoToEnderecos(

      this.estoqueRepository,

      [item],

    );

    const saldoLinha = resolveSaldoEsperadoLinha(

      itemComSaldo?.saldoEsperado ?? [],

      { produtoId: produto.produtoId, lote: input.lote },

    );



    return this.inventarioRepository.submitContagemCega({

      ...input,

      codigoProduto: produto.sku,

      produtoId: produto.produtoId,

      saldoEnderecoId: saldoLinha?.saldoEnderecoId ?? undefined,

      enderecoVazio: false,

    });

  }

}



@Injectable()

export class SubmitContagemValidacaoUseCase {

  constructor(

    @Inject(INVENTARIO_REPOSITORY)

    private readonly inventarioRepository: IInventarioRepository,

    @Inject(ESTOQUE_REPOSITORY)

    private readonly estoqueRepository: IEstoqueRepository,

  ) {}



  async execute(input: SubmitContagemValidacaoInput) {

    const demanda = await this.inventarioRepository.findDemandaById(

      input.demandaId,

    );



    if (!demanda) {

      throw new NotFoundException(`Demanda "${input.demandaId}" não encontrada`);

    }



    if (demanda.tipo !== 'validacao') {

      throw new BadRequestException(

        'Esta demanda não é do tipo validação',

      );

    }



    const item = await this.inventarioRepository.findDemandaEnderecoById(

      input.demandaId,

      input.demandaEnderecoId,

    );



    if (!item) {

      throw new NotFoundException('Endereço da demanda não encontrado');

    }



    if (

      input.enderecoConfirmado &&

      !enderecosConferem(input.enderecoConfirmado, item.enderecoMascarado)

    ) {

      throw new BadRequestException(

        'Endereço não confere com o designado. Verifique e escaneie novamente.',

      );

    }



    const [itemComSaldo] = await attachSaldoEsperadoToEnderecos(

      this.estoqueRepository,

      [item],

    );

    const saldosEsperados = itemComSaldo?.saldoEsperado ?? [];



    if (

      !input.enderecoVazio &&

      !input.anomaliaEncontrada &&

      saldosEsperados.length === 0

    ) {

      throw new BadRequestException(

        'Não há saldo registrado para este endereço. Marque como endereço vazio ou anomalia.',

      );

    }



    const saldoLinha = resolveSaldoEsperadoLinha(saldosEsperados, {
      lote: input.lote,
      saldoEnderecoId: input.saldoEnderecoId,
      produtoId: input.produtoId,
    });



    let quantidadeCaixas = input.quantidadeCaixas;

    let quantidadeUnidades = input.quantidadeUnidades;

    let produtoId = input.produtoId ?? saldoLinha?.produtoId ?? null;

    let saldoEnderecoId = saldoLinha?.saldoEnderecoId ?? null;

    let codigoProduto = input.codigoProduto.trim() || saldoLinha?.sku || 'N/A';

    let correspondeAoEsperado = input.correspondeAoEsperado;



    if (input.enderecoVazio) {

      quantidadeCaixas = 0;

      quantidadeUnidades = 0;

      correspondeAoEsperado = false;

    } else if (input.anomaliaEncontrada) {

      correspondeAoEsperado = false;

    } else if (input.correspondeAoEsperado) {

      if (!saldoLinha) {

        throw new BadRequestException(

          'Não foi possível identificar o saldo esperado para confirmar a contagem.',

        );

      }

      const quantidadeEsperada = Math.round(saldoLinha.quantidade);
      const totalInformado = calcularQuantidadeContadaUnidades(
        input.quantidadeCaixas,
        input.quantidadeUnidades,
        saldoLinha.unidadesPorCaixa,
      );

      if (totalInformado > 0 && totalInformado !== quantidadeEsperada) {
        correspondeAoEsperado = false;
        quantidadeCaixas = input.quantidadeCaixas;
        quantidadeUnidades = input.quantidadeUnidades;
      } else {
        quantidadeCaixas = 0;
        quantidadeUnidades = quantidadeEsperada;
        correspondeAoEsperado = true;
      }

      produtoId = saldoLinha.produtoId;

      saldoEnderecoId = saldoLinha.saldoEnderecoId;

      codigoProduto = saldoLinha.sku;

    } else {

      const totalContado = calcularQuantidadeContadaUnidades(

        quantidadeCaixas,

        quantidadeUnidades,

        saldoLinha?.unidadesPorCaixa,

      );



      if (totalContado <= 0 && !input.lote?.trim()) {

        throw new BadRequestException('Informe a quantidade real encontrada.');

      }



      correspondeAoEsperado = false;

      if (saldoLinha) {

        produtoId = saldoLinha.produtoId;

        saldoEnderecoId = saldoLinha.saldoEnderecoId;

        codigoProduto = saldoLinha.sku;

      }

    }



    if (item.status === 'pendente') {

      await this.inventarioRepository.markDemandaEnderecoEmAndamento(

        item.id,

      );

    }



    const contagem = await this.inventarioRepository.submitContagemValidacao({

      ...input,

      quantidadeCaixas,

      quantidadeUnidades,

      codigoProduto,

      produtoId: produtoId ?? undefined,

      saldoEnderecoId: saldoEnderecoId ?? undefined,

      correspondeAoEsperado,

    });

    await reconciliarDivergenciaRecontagem(
      this.inventarioRepository,
      this.estoqueRepository,
      input.demandaId,
      contagem,
      item.enderecoId,
      item.unidadeId,
    );

    return contagem;

  }

}



@Injectable()

export class SubmitContagemAvariaUseCase {

  constructor(

    @Inject(INVENTARIO_REPOSITORY)

    private readonly inventarioRepository: IInventarioRepository,

  ) {}



  async execute(input: SubmitContagemAvariaInput) {

    const item = await this.inventarioRepository.findDemandaEnderecoById(

      input.demandaId,

      input.demandaEnderecoId,

    );



    if (!item) {

      throw new NotFoundException('Endereço da demanda não encontrado');

    }



    if (input.quantidadeCaixas <= 0 && input.quantidadeUnidades <= 0) {

      throw new BadRequestException('Informe caixas e/ou unidades avariadas');

    }



    return this.inventarioRepository.submitContagemAvaria(input);

  }

}


