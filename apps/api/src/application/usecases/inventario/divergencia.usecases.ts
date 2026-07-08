import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { aplicarDivergenciaInventario } from '../../services/inventario/aplicar-divergencia-inventario.js';
import { InventarioDivergenciaEventPublisher } from '../../services/inventario/inventario-divergencia-event.publisher.js';
import { reconciliarDivergenciasRecontagemPendentes } from '../../services/inventario/reconciliar-divergencia-recontagem.js';
import {
  isDemandaRecontagemAberta,
  type DemandaContagemPrioridade,
  type DivergenciaInventarioTipo,
} from '../../../domain/model/inventario/inventario.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import {
  INVENTARIO_REPOSITORY,
  type IInventarioRepository,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { AplicarDivergenciaJobData } from '../../../infra/queues/inventario-divergencia.queue.js';

const TIPOS_RECONTAGEM_PERMITIDOS: DivergenciaInventarioTipo[] = [
  'falta',
  'sobra',
  'anomalia',
  'endereco_vazio',
];

export type SolicitarRecontagemDivergenciaInput = {
  inventarioId: string;
  divergenciaId: string;
  responsavelId: number;
  prioridade?: DemandaContagemPrioridade;
  motivo?: string;
  solicitadaPor: number | null;
};

@Injectable()
export class ListDivergenciasInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(inventarioId: string) {
    const inventario =
      await this.inventarioRepository.findInventarioById(inventarioId);

    if (!inventario) {
      throw new NotFoundException(`Inventário "${inventarioId}" não encontrado`);
    }

    await reconciliarDivergenciasRecontagemPendentes(
      this.inventarioRepository,
      this.estoqueRepository,
      inventarioId,
    );

    return this.inventarioRepository.listDivergenciasByInventario(inventarioId);
  }
}

@Injectable()
export class AprovarDivergenciaInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
    private readonly inventarioDivergenciaEventPublisher: InventarioDivergenciaEventPublisher,
  ) {}

  async execute(
    inventarioId: string,
    divergenciaId: string,
    operatorId: number | null,
    motivoAprovacao?: string | null,
  ) {
    const inventario =
      await this.inventarioRepository.findInventarioById(inventarioId);

    if (!inventario) {
      throw new NotFoundException(`Inventário "${inventarioId}" não encontrado`);
    }

    const divergencia =
      await this.inventarioRepository.findDivergenciaById(divergenciaId);

    if (!divergencia || divergencia.inventarioId !== inventarioId) {
      throw new NotFoundException(
        `Divergência "${divergenciaId}" não encontrada`,
      );
    }

    if (divergencia.status !== 'pendente') {
      throw new BadRequestException(
        'Somente divergências pendentes podem ser aprovadas',
      );
    }

    if (
      divergencia.recontagemAtual &&
      isDemandaRecontagemAberta(divergencia.recontagemAtual.demandaStatus)
    ) {
      throw new BadRequestException(
        'Não é possível aprovar enquanto houver recontagem em andamento',
      );
    }

    const updated = await this.inventarioRepository.updateDivergenciaStatus(
      divergenciaId,
      {
        status: 'aprovada',
        aprovadaPor: operatorId,
        aprovadaEm: new Date(),
        motivoAprovacao: motivoAprovacao?.trim() || null,
      },
    );

    await this.inventarioDivergenciaEventPublisher.publicarAplicarDivergencia(
      divergenciaId,
      operatorId,
    );

    return updated;
  }
}

@Injectable()
export class ReprovarDivergenciaInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(
    inventarioId: string,
    divergenciaId: string,
    operatorId: number | null,
    motivoReprovacao: string,
  ) {
    const inventario =
      await this.inventarioRepository.findInventarioById(inventarioId);

    if (!inventario) {
      throw new NotFoundException(`Inventário "${inventarioId}" não encontrado`);
    }

    const divergencia =
      await this.inventarioRepository.findDivergenciaById(divergenciaId);

    if (!divergencia || divergencia.inventarioId !== inventarioId) {
      throw new NotFoundException(
        `Divergência "${divergenciaId}" não encontrada`,
      );
    }

    if (divergencia.status !== 'pendente') {
      throw new BadRequestException(
        'Somente divergências pendentes podem ser reprovadas',
      );
    }

    return this.inventarioRepository.updateDivergenciaStatus(divergenciaId, {
      status: 'reprovada',
      reprovadaPor: operatorId,
      reprovadaEm: new Date(),
      motivoReprovacao: motivoReprovacao.trim(),
    });
  }
}

@Injectable()
export class SolicitarRecontagemDivergenciaUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
  ) {}

  async execute(input: SolicitarRecontagemDivergenciaInput) {
    const inventario = await this.inventarioRepository.findInventarioById(
      input.inventarioId,
    );

    if (!inventario) {
      throw new NotFoundException(
        `Inventário "${input.inventarioId}" não encontrado`,
      );
    }

    if (
      inventario.status !== 'em_progresso' &&
      inventario.status !== 'concluido'
    ) {
      throw new BadRequestException(
        'Recontagens só podem ser solicitadas em inventários em progresso ou concluídos',
      );
    }

    const divergencia = await this.inventarioRepository.findDivergenciaById(
      input.divergenciaId,
    );

    if (!divergencia || divergencia.inventarioId !== input.inventarioId) {
      throw new NotFoundException(
        `Divergência "${input.divergenciaId}" não encontrada`,
      );
    }

    if (divergencia.status !== 'pendente') {
      throw new BadRequestException(
        'Somente divergências pendentes podem receber recontagem',
      );
    }

    if (!TIPOS_RECONTAGEM_PERMITIDOS.includes(divergencia.tipo)) {
      throw new BadRequestException(
        'Este tipo de divergência não permite recontagem',
      );
    }

    const recontagemAberta =
      await this.inventarioRepository.findRecontagemAbertaByDivergencia(
        input.divergenciaId,
      );

    if (recontagemAberta) {
      throw new BadRequestException(
        'Já existe uma recontagem em andamento para esta divergência',
      );
    }

    const enderecos =
      await this.inventarioRepository.findEnderecosByIdsForCentro(
        inventario.centroId,
        [divergencia.enderecoId],
        divergencia.sku,
      );

    if (enderecos.length === 0) {
      throw new BadRequestException(
        'Endereço da divergência não pertence ao centro deste inventário',
      );
    }

    const loteLabel = divergencia.lote?.trim()
      ? ` · lote ${divergencia.lote.trim()}`
      : '';
    const motivoInformado = input.motivo?.trim() ?? '';
    const observacoes = [
      `Recontagem da divergência ${divergencia.sku}${loteLabel}.`,
      motivoInformado,
    ]
      .filter(Boolean)
      .join(' ');

    const demanda = await this.inventarioRepository.createDemanda(
      {
        inventarioId: input.inventarioId,
        nome: `Recontagem - ${divergencia.sku} - ${divergencia.enderecoMascarado}`,
        tipo: 'validacao',
        prioridade: input.prioridade ?? 'alta',
        ativo: true,
        responsavelId: input.responsavelId,
        filtros: {
          enderecoIds: [divergencia.enderecoId],
          zonas: [divergencia.zona],
          categorias: [],
          skuBusca: divergencia.sku,
        },
        observacoes,
        alertaFragilidade: false,
      },
      [divergencia.enderecoId],
    );

    await this.inventarioRepository.activateDemandaContagem(demanda.id);

    await this.inventarioRepository.createDivergenciaRecontagem({
      inventarioId: input.inventarioId,
      divergenciaId: input.divergenciaId,
      demandaId: demanda.id,
      solicitadaPor: input.solicitadaPor,
      responsavelId: input.responsavelId,
      motivo: motivoInformado,
    });

    const updated = await this.inventarioRepository.findDivergenciaById(
      input.divergenciaId,
    );

    if (!updated) {
      throw new NotFoundException(
        `Divergência "${input.divergenciaId}" não encontrada após solicitar recontagem`,
      );
    }

    return updated;
  }
}

@Injectable()
export class AplicarDivergenciaInventarioUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepository: IInventarioRepository,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(data: AplicarDivergenciaJobData): Promise<void> {
    const divergencia = await this.inventarioRepository.findDivergenciaById(
      data.divergenciaId,
    );

    if (!divergencia) {
      throw new NotFoundException(
        `Divergência "${data.divergenciaId}" não encontrada`,
      );
    }

    await aplicarDivergenciaInventario(
      this.estoqueRepository,
      this.inventarioRepository,
      divergencia,
      data.operatorId,
    );
  }
}
