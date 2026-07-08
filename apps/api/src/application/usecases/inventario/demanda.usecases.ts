import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateDemandaContagemInput } from '../../../domain/model/inventario/inventario.model.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';

@Injectable()
export class CreateDemandaContagemUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(data: CreateDemandaContagemInput) {
    const inventario = await this.inventarioRepository.findInventarioById(
      data.inventarioId,
    );

    if (!inventario) {
      throw new NotFoundException(
        `Inventário "${data.inventarioId}" não encontrado`,
      );
    }

    if (
      inventario.status !== 'agendado' &&
      inventario.status !== 'em_progresso'
    ) {
      throw new BadRequestException(
        'Demandas só podem ser criadas em inventários agendados ou em progresso',
      );
    }

    const skuBusca =
      data.tipo === 'validacao'
        ? data.filtros.skuBusca?.trim() || undefined
        : undefined;

    let enderecoIds: string[];

    if ((data.filtros.enderecoIds?.length ?? 0) > 0) {
      const selecionados =
        await this.inventarioRepository.findEnderecosByIdsForCentro(
          inventario.centroId,
          data.filtros.enderecoIds,
          skuBusca,
        );

      if (skuBusca) {
        if (selecionados.length === 0) {
          throw new BadRequestException(
            'Nenhum endereço selecionado possui saldo do SKU informado',
          );
        }

        enderecoIds = selecionados.map((item) => item.id);
      } else {
        if (selecionados.length !== data.filtros.enderecoIds.length) {
          throw new BadRequestException(
            'Um ou mais endereços não pertencem ao centro deste inventário',
          );
        }

        enderecoIds = selecionados.map((item) => item.id);
      }
    } else {
      const filtros =
        data.tipo === 'validacao'
          ? data.filtros
          : { ...data.filtros, skuBusca: undefined };

      const enderecos =
        await this.inventarioRepository.resolveEnderecosForDemanda(
          inventario.centroId,
          filtros,
        );

      if (enderecos.length === 0) {
        throw new BadRequestException(
          skuBusca
            ? 'Nenhum endereço encontrado com saldo do SKU informado para os filtros selecionados'
            : 'Nenhum endereço encontrado para os filtros informados',
        );
      }

      enderecoIds = enderecos.map((item) => item.id);
    }

    return this.inventarioRepository.createDemanda(data, enderecoIds);
  }
}

@Injectable()
export class ListDemandasContagemUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(inventarioId: string) {
    const inventario =
      await this.inventarioRepository.findInventarioById(inventarioId);

    if (!inventario) {
      throw new NotFoundException(
        `Inventário "${inventarioId}" não encontrado`,
      );
    }

    return this.inventarioRepository.listDemandasByInventario(inventarioId);
  }
}

@Injectable()
export class DeleteDemandaContagemUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(inventarioId: string, demandaId: string) {
    const inventario =
      await this.inventarioRepository.findInventarioById(inventarioId);

    if (!inventario) {
      throw new NotFoundException(
        `Inventário "${inventarioId}" não encontrado`,
      );
    }

    if (inventario.status !== 'agendado') {
      throw new BadRequestException(
        'Demandas só podem ser removidas em inventários agendados',
      );
    }

    await this.inventarioRepository.deleteDemanda(inventarioId, demandaId);
  }
}

@Injectable()
export class ResolveDemandaEnderecosUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  execute(centroId: string, filtros: CreateDemandaContagemInput['filtros']) {
    return this.inventarioRepository.resolveEnderecosForDemanda(
      centroId,
      filtros,
    );
  }
}
