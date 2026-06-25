import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapCorteDetalheToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { CorteDetalheResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import type { SolicitarCorteInput } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class SolicitarCorteUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: SolicitarCorteInput): Promise<CorteDetalheResponseDto> {
    const mapa = await this.corteOperacionalRepository.findMapaGrupoPorCodigo(
      input.mapaGrupoMicroUuid,
      input.unidadeId,
    );

    if (!mapa || mapa.id !== input.mapaGrupoId) {
      throw new NotFoundException('Mapa-grupo não encontrado para solicitação');
    }

    if (mapa.processo !== 'separacao') {
      throw new BadRequestException(
        'Corte operacional só é permitido para mapas de separação',
      );
    }

    const corteAtivo =
      await this.corteOperacionalRepository.existsCorteAtivoByMapaGrupoId(
        input.mapaGrupoId,
      );

    if (corteAtivo) {
      throw new BadRequestException(
        'Já existe um corte ativo para este mapa-grupo',
      );
    }

    const itemIds = input.itens.map((item) => item.mapaGrupoItemId);
    const itensMapa =
      await this.corteOperacionalRepository.findMapaGrupoItensByIds(
        itemIds,
        input.mapaGrupoId,
      );

    if (itensMapa.length !== itemIds.length) {
      throw new BadRequestException(
        'Um ou mais itens não pertencem ao mapa-grupo informado',
      );
    }

    const itensMapaById = new Map(itensMapa.map((item) => [item.id, item]));

    const itensPersistencia = input.itens.map((itemInput) => {
      const itemMapa = itensMapaById.get(itemInput.mapaGrupoItemId);

      if (!itemMapa) {
        throw new BadRequestException('Item do mapa-grupo não encontrado');
      }

      if (itemInput.quantidadeCorte > itemMapa.quantidade) {
        throw new BadRequestException(
          `Quantidade de corte do SKU ${itemMapa.sku} excede a quantidade do mapa`,
        );
      }

      return {
        mapaGrupoItemId: itemMapa.id,
        quantidadeCorte: itemInput.quantidadeCorte,
        sku: itemMapa.sku,
        descricao: itemMapa.descricao,
        remessa: itemMapa.remessa,
        cliente: itemMapa.cliente,
        lote: itemMapa.lote,
        quantidadeMapa: itemMapa.quantidade,
        unidadeMedida: itemMapa.unidadeMedida,
        peso: itemMapa.peso,
      };
    });

    const corte = await this.corteOperacionalRepository.solicitarCorte({
      ...input,
      rota: mapa.transporteRota,
      transporteId: mapa.transporteId,
      mapaGrupoTitulo: mapa.titulo,
      itens: itensPersistencia,
    });

    return mapCorteDetalheToDto(corte);
  }
}
