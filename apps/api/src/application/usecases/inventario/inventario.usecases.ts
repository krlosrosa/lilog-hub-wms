import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateInventarioInput } from '../../../domain/model/inventario/inventario.model.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';

@Injectable()
export class CreateInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  execute(data: CreateInventarioInput) {
    return this.inventarioRepository.createInventario(data);
  }
}

@Injectable()
export class ListInventariosUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  execute(filter: Parameters<IInventarioRepository['listInventarios']>[0]) {
    return this.inventarioRepository.listInventarios(filter);
  }
}

@Injectable()
export class GetInventarioKpiUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  execute() {
    return this.inventarioRepository.getInventarioKpi();
  }
}

@Injectable()
export class GetInventarioTrendUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  execute() {
    return this.inventarioRepository.getInventarioTrend();
  }
}

@Injectable()
export class GetInventarioDetalheUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(id: string) {
    const detalhe = await this.inventarioRepository.getInventarioDetalhe(id);

    if (!detalhe) {
      throw new NotFoundException(`Inventário "${id}" não encontrado`);
    }

    return detalhe;
  }
}

@Injectable()
export class UpdateInventarioStatusUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(
    id: string,
    status: 'pausado' | 'em_progresso' | 'concluido',
  ) {
    const inventario = await this.inventarioRepository.findInventarioById(id);

    if (!inventario) {
      throw new NotFoundException(`Inventário "${id}" não encontrado`);
    }

    const updated = await this.inventarioRepository.updateInventarioStatus(
      id,
      status,
    );

    if (!updated) {
      throw new NotFoundException(`Inventário "${id}" não encontrado`);
    }

    return updated;
  }
}

@Injectable()
export class IniciarInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(id: string) {
    const inventario = await this.inventarioRepository.findInventarioById(id);

    if (!inventario) {
      throw new NotFoundException(`Inventário "${id}" não encontrado`);
    }

    if (inventario.status !== 'agendado' && inventario.status !== 'pausado') {
      throw new BadRequestException(
        'Somente inventários agendados ou pausados podem ser iniciados',
      );
    }

    const demandas =
      await this.inventarioRepository.listDemandasByInventario(id);

    if (demandas.length === 0) {
      throw new BadRequestException(
        'Cadastre ao menos uma demanda antes de iniciar o inventário',
      );
    }

    const updated = await this.inventarioRepository.iniciarInventario(id);

    if (!updated) {
      throw new NotFoundException(`Inventário "${id}" não encontrado`);
    }

    return updated;
  }
}
