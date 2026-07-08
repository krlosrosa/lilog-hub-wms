import { Injectable } from '@nestjs/common';

import type { ItemAguardandoArmazenagem } from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { dividirQuantidadePorPaletes } from '../../../domain/services/dividir-quantidade-por-paletes.js';
import { gerarCodigoUnitizadorPalete } from '../../../domain/services/gerar-codigo-unitizador-palete.js';

export type PaleteSimulado = {
  produtoId: string;
  sequenciaGlobal: number;
  sequenciaProduto: number;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  codigoUnitizador: string;
  itemBase: ItemAguardandoArmazenagem;
};

export type MontarPaletesArmazenagemInput = {
  itensAguardandoArmazenagem: ItemAguardandoArmazenagem[];
  paletesPorProduto: Map<string, number>;
  numeroRecebimento: string;
};

@Injectable()
export class MontarPaletesArmazenagemService {
  execute(input: MontarPaletesArmazenagemInput): PaleteSimulado[] {
    const paletes: PaleteSimulado[] = [];
    let sequenciaGlobal = 1;

    for (const item of input.itensAguardandoArmazenagem) {
      const qtdPaletes = input.paletesPorProduto.get(item.produtoId);

      if (!qtdPaletes) {
        continue;
      }

      const quantidades = dividirQuantidadePorPaletes(item.quantidade, qtdPaletes);

      quantidades.forEach((quantidade, index) => {
        paletes.push({
          produtoId: item.produtoId,
          sequenciaGlobal,
          sequenciaProduto: index + 1,
          quantidade,
          unidadeMedida: item.unidadeMedida,
          lote: item.lote,
          validade: item.validade,
          numeroSerie: item.numeroSerie,
          codigoUnitizador: gerarCodigoUnitizadorPalete(
            input.numeroRecebimento,
            sequenciaGlobal,
          ),
          itemBase: item,
        });
        sequenciaGlobal += 1;
      });
    }

    return paletes;
  }
}
