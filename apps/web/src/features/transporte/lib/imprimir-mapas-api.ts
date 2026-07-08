import { apiDownloadBlob, downloadBlobArquivo } from '@/lib/api';

export type TipoMapaImpressao =
  | 'separacao'
  | 'conferencia'
  | 'conferencia_reentrega'
  | 'carregamento'
  | 'todos';

export type ImprimirMapaConferenciaReentregaPayload = {
  unidadeId: string;
  transporteIds: string[];
  configuracaoImpressaoId: string;
};

export type ImprimirMapasPayload = {
  unidadeId: string;
  transporteIds: string[];
  configuracaoImpressaoId: string;
  tipoMapa: TipoMapaImpressao;
};

export async function imprimirMapasApi(payload: ImprimirMapasPayload) {
  const { blob, filename } = await apiDownloadBlob('/expedicao/mapas/imprimir', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  downloadBlobArquivo(blob, filename);

  return { filename };
}

export async function imprimirMapaConferenciaReentregaApi(
  payload: ImprimirMapaConferenciaReentregaPayload,
) {
  const { blob, filename } = await apiDownloadBlob(
    '/expedicao/mapas/conferencia-reentrega',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  downloadBlobArquivo(blob, filename);

  return { filename };
}
