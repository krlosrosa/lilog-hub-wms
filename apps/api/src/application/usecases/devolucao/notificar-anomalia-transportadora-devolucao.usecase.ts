import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  montarHtmlEmailAnomaliaDevolucao,
  montarTextoEmailAnomaliaDevolucao,
} from '../../services/devolucao/montar-html-email-anomalia-devolucao.js';
import { resolveAvariaPhotoUrls } from '../../services/devolucao/resolve-avaria-photo-urls.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  EMAIL_PROVIDER,
  type IEmailProvider,
} from '../../../infra/clients/email/email.types.js';
import { isEmailConfigured } from '../../../infra/clients/email/email.provider.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { resolverTransportadoraDevolucaoDb } from '../../../infra/db/cobranca-transportadora/resolver-transportadora-devolucao.drizzle.js';

export type NotificarAnomaliaTransportadoraDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
};

@Injectable()
export class NotificarAnomaliaTransportadoraDevolucaoUseCase {
  private readonly logger = new Logger(
    NotificarAnomaliaTransportadoraDevolucaoUseCase.name,
  );

  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: NotificarAnomaliaTransportadoraDevolucaoInput,
  ): Promise<void> {
    if (!isEmailConfigured(this.configService)) {
      this.logger.log(
        'RESEND_API_KEY não configurada; notificação de anomalia ignorada.',
      );
      return;
    }

    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      this.logger.warn(
        `Demanda ${input.demandaId} não encontrada para notificação.`,
      );
      return;
    }

    const [avariasRaw, faltasPeso] = await Promise.all([
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

    const avarias = avariasRaw.filter((avaria) => avaria.tipo !== 'falta');

    if (avarias.length === 0 && faltasPeso.length === 0) {
      this.logger.log(
        `Demanda ${demanda.codigoDemanda} concluída sem anomalias para notificar.`,
      );
      return;
    }

    const transporteId =
      demanda.notasFiscais.find((nf) => nf.transporteId)?.transporteId ?? null;

    const transportadoraResolvida = await resolverTransportadoraDevolucaoDb(
      this.db,
      input.unidadeId,
      transporteId,
    );

    if (!transportadoraResolvida.transportadoraId) {
      this.logger.warn(
        `Transportadora não resolvida para demanda ${demanda.codigoDemanda}.`,
      );
      return;
    }

    const transportadora = await this.transportadoraRepository.findById(
      transportadoraResolvida.transportadoraId,
    );

    if (!transportadora || transportadora.emails.length === 0) {
      this.logger.warn(
        `Transportadora ${transportadoraResolvida.transportadoraId} sem e-mails cadastrados.`,
      );
      return;
    }

    const avariasComFotos = await Promise.all(
      avarias.map(async (avaria) => ({
        tipo: avaria.tipo,
        itemSku: avaria.itemSku,
        natureza: avaria.natureza,
        causa: avaria.causa,
        quantidadeCaixa: avaria.quantidadeCaixa,
        quantidadeUnidade: avaria.quantidadeUnidade,
        observacao: avaria.observacao,
        photoUrls: await resolveAvariaPhotoUrls(
          this.documentoRepository,
          this.r2Config,
          avaria.photoUrls,
        ),
      })),
    );

    const emailContent = {
      codigoDemanda: demanda.codigoDemanda,
      transportadoraNome: transportadoraResolvida.transportadoraNome,
      placa: demanda.placa,
      transporteId: transportadoraResolvida.transporteId,
      avarias: avariasComFotos,
      faltasPeso: faltasPeso.map((falta) => ({
        sku: falta.sku,
        descricaoProduto: falta.descricaoProduto,
        pesoEsperadoKg: falta.pesoEsperadoKg,
        pesoDevolvidoKg: falta.pesoDevolvidoKg,
        pesoFaltanteKg: falta.pesoFaltanteKg,
        quantidadeContabilConsiderada: falta.quantidadeContabilConsiderada,
        motivo: falta.motivo,
        observacao: falta.observacao,
      })),
    };

    const html = montarHtmlEmailAnomaliaDevolucao(emailContent);
    const text = montarTextoEmailAnomaliaDevolucao(emailContent);

    await this.emailProvider.send({
      to: transportadora.emails,
      subject: `[Devolução] Ocorrência na demanda ${demanda.codigoDemanda}`,
      html,
      text,
    });

    this.logger.log(
      `E-mail de anomalia enviado para transportadora ${transportadora.nome} (${transportadora.emails.join(', ')}) — demanda ${demanda.codigoDemanda}.`,
    );
  }
}
