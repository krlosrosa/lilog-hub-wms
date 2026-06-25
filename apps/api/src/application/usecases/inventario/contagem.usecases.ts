import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';

import { enderecosConferem } from '../../../domain/model/inventario/inventario.model.js';
import type {
  SubmitContagemAvariaInput,
  SubmitContagemCegaInput,
  SubmitContagemValidacaoInput,
} from '../../../domain/model/inventario/inventario.model.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';

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

    return this.inventarioRepository.listDemandaEnderecos(demandaId);
  }
}

@Injectable()
export class SubmitContagemCegaUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
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

    if (input.quantidadeCaixas <= 0 && input.quantidadeUnidades <= 0) {
      throw new BadRequestException('Informe caixas ou unidades');
    }

    if (item.status === 'pendente') {
      await this.inventarioRepository.markDemandaEnderecoEmAndamento(
        item.id,
      );
    }

    return this.inventarioRepository.submitContagemCega(input);
  }
}

@Injectable()
export class SubmitContagemValidacaoUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(input: SubmitContagemValidacaoInput) {
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

    if (item.status === 'pendente') {
      await this.inventarioRepository.markDemandaEnderecoEmAndamento(
        item.id,
      );
    }

    return this.inventarioRepository.submitContagemValidacao(input);
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
