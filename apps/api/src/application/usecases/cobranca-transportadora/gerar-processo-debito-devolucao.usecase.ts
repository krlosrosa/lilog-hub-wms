import { Inject, Injectable } from '@nestjs/common';

import { PortalNotificacaoService } from '../../services/portal-notificacao.service.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type CriarProcessoDebitoInput,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoItemInput,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { resolverTransportadoraDevolucaoDb } from '../../../infra/db/cobranca-transportadora/resolver-transportadora-devolucao.drizzle.js';

type GerarProcessoDebitoDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
};

@Injectable()
export class GerarProcessoDebitoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
    private readonly portalNotificacaoService: PortalNotificacaoService,
  ) {}

  async execute(input: GerarProcessoDebitoDevolucaoInput): Promise<void> {
    const existente = await this.cobrancaRepository.buscarProcessoPorDemandaId(
      input.demandaId,
      input.unidadeId,
    );

    if (existente) {
      return;
    }

    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      return;
    }

    const [avarias, faltasPeso] = await Promise.all([
      this.devolucaoRepository.listarAvariasDetalhe(
        input.demandaId,
        input.unidadeId,
      ),
      this.devolucaoRepository.listarFaltasPeso({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
        status: 'validada',
      }),
    ]);

    const itens: ProcessoDebitoItemInput[] = [];

    const itemPorId = new Map<
      string,
      { notaFiscalId: string; sku: string; descricaoProduto: string | null }
    >();

    for (const nf of demanda.notasFiscais) {
      for (const item of nf.itens) {
        itemPorId.set(item.id, {
          notaFiscalId: nf.id,
          sku: item.sku,
          descricaoProduto: item.descricaoProduto,
        });
      }
    }

    for (const avaria of avarias) {
      // Registros automáticos de item não conferido são salvos em devolucao_avarias
      // com tipo "falta" e tratados pelo loop de divergência abaixo.
      if (avaria.tipo === 'falta') continue;

      const itemRef = avaria.itemId ? itemPorId.get(avaria.itemId) : undefined;
      const quantidade =
        avaria.quantidadeUnidade > 0
          ? avaria.quantidadeUnidade
          : avaria.quantidadeCaixa > 0
            ? avaria.quantidadeCaixa
            : null;

      itens.push({
        demandaId: input.demandaId,
        notaFiscalId: itemRef?.notaFiscalId ?? null,
        itemId: avaria.itemId,
        avariaId: avaria.id,
        tipo: 'avaria',
        sku: avaria.itemSku ?? avaria.skusAfetados?.[0] ?? null,
        descricaoProduto: itemRef?.descricaoProduto ?? null,
        quantidade,
        valorDebito: 0,
        motivo: avaria.causa ?? avaria.tipo,
      });
    }

    for (const falta of faltasPeso) {
      itens.push({
        demandaId: input.demandaId,
        notaFiscalId: falta.notaFiscalId,
        itemId: falta.itemId,
        faltaPesoId: falta.id,
        tipo: 'falta',
        sku: falta.sku,
        descricaoProduto: falta.descricaoProduto,
        quantidade: falta.quantidadeContabilConsiderada,
        pesoKg: falta.pesoFaltanteKg,
        valorDebito: 0,
        motivo: falta.motivo ?? 'Falta de peso',
      });
    }

    for (const nf of demanda.notasFiscais) {
      for (const item of nf.itens) {
        if (item.qtdConferida == null) continue;

        const esperado = item.quantidade;
        const conferido = item.qtdConferida;
        const diff = conferido - esperado;

        if (diff >= 0) continue;

        const jaRegistrado = itens.some(
          (i) =>
            i.itemId === item.id &&
            (i.tipo === 'falta' || i.faltaPesoId != null),
        );

        if (jaRegistrado) continue;

        itens.push({
          demandaId: input.demandaId,
          notaFiscalId: nf.id,
          itemId: item.id,
          tipo: 'falta',
          sku: item.sku,
          descricaoProduto: item.descricaoProduto,
          quantidade: Math.abs(diff),
          valorDebito: 0,
          motivo: 'Divergência de conferência — faltante',
        });
      }
    }

    if (itens.length === 0) {
      return;
    }

    const transporteId =
      demanda.notasFiscais.find((nf) => nf.transporteId)?.transporteId ?? null;

    const transportadora = await resolverTransportadoraDevolucaoDb(
      this.db,
      input.unidadeId,
      transporteId,
    );

    const criarInput: CriarProcessoDebitoInput = {
      unidadeId: input.unidadeId,
      demandaId: input.demandaId,
      transporteId: transportadora.transporteId,
      transportadoraId: transportadora.transportadoraId,
      transportadoraNome: transportadora.transportadoraNome,
      observacao: `Gerado automaticamente da demanda ${demanda.codigoDemanda}`,
      itens,
    };

    const result = await this.cobrancaRepository.criarProcessoDebito(criarInput);

    await this.portalNotificacaoService.notificarNovoDebito({
      processoDebitoId: result.id,
      transportadoraId: criarInput.transportadoraId ?? null,
      codigoDemanda: demanda.codigoDemanda,
    });
  }
}
