'use client';

import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import { toast } from 'sonner';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  CNC_OPCOES_IMPRESSAO_PADRAO,
  resolverOpcoesImpressao,
  type CncImpressaoOpcoes,
} from '@/features/cnc/types/cnc-impressao.schema';
import { aguardarRenderImpressao } from '@/features/peso-variavel/lib/imprimir-etiquetas';
import {
  getPreRecebimento,
  getRecebimento,
} from '@/features/recebimento/lib/recebimento-api';
import type { NotaFiscalPreRecebimentoApi } from '@/features/recebimento/types/recebimento.api';

async function preloadImagens(urls: string[]) {
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const imagem = new Image();
          imagem.onload = () => resolve();
          imagem.onerror = () => resolve();
          imagem.src = url;
        }),
    ),
  );
}

export type DadosRecebimentoImpressao = {
  transportadora: string | null;
  placa: string | null;
  nfs: NotaFiscalPreRecebimentoApi[];
  origemNome: string | null;
};

export function useCncPrint(
  cnc: CncDetalhe | null,
  fotoUrls: string[] = [],
) {
  const [imprimindo, setImprimindo] = useState(false);
  const [dadosRecebimento, setDadosRecebimento] =
    useState<DadosRecebimentoImpressao | null>(null);
  const [opcoesImpressao, setOpcoesImpressao] = useState<CncImpressaoOpcoes>(
    cnc ? resolverOpcoesImpressao(cnc.opcoesImpressao) : CNC_OPCOES_IMPRESSAO_PADRAO,
  );

  const imprimir = useCallback(
    async (opcoes?: CncImpressaoOpcoes) => {
      if (!cnc) {
        return;
      }

      const opcoesFinais =
        opcoes ?? resolverOpcoesImpressao(cnc.opcoesImpressao);

      setImprimindo(true);

      try {
        flushSync(() => {
          setOpcoesImpressao(opcoesFinais);
        });

        if (cnc.origem === 'recebimento') {
          const recebimento = await getRecebimento(cnc.origemId);
          const preRecebimento = await getPreRecebimento(
            recebimento.preRecebimentoId,
          );

          flushSync(() => {
            setDadosRecebimento({
              transportadora: preRecebimento.transportadoraNome,
              placa: preRecebimento.placa,
              nfs: preRecebimento.notasFiscais ?? [],
              origemNome: preRecebimento.numeroTransporte,
            });
          });
        } else {
          flushSync(() => {
            setDadosRecebimento(null);
          });
        }

        await aguardarRenderImpressao();
        await preloadImagens(fotoUrls);
        await aguardarRenderImpressao();
        window.print();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível preparar a impressão da CNC.',
        );
      } finally {
        setImprimindo(false);
      }
    },
    [cnc, fotoUrls],
  );

  return {
    imprimir,
    imprimindo,
    dadosRecebimento,
    opcoesImpressao,
  };
}
