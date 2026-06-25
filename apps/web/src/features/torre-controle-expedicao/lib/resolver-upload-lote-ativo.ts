import { persistUploadLoteAtivo, readUploadLoteAtivo } from '@/features/expedicao/storage/upload-lote-ativo-storage';
import { listTransportes } from '@/features/transporte/lib/expedicao-api';
import { resolverUploadLoteIdTransportes } from '@/features/torre-controle-expedicao/lib/torre-controle-routes';

function dataReferenciaHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function resolverUploadLoteIdAtivo(
  unidadeId: string,
): Promise<string | null> {
  const armazenado = readUploadLoteAtivo(unidadeId);
  if (armazenado) {
    return armazenado;
  }

  const response = await listTransportes(unidadeId);
  const transportesHoje = response.transportes.filter(
    (transporte) => transporte.dataTransporte === dataReferenciaHoje(),
  );

  const uploadLoteId =
    resolverUploadLoteIdTransportes(transportesHoje) ??
    resolverUploadLoteIdTransportes(response.transportes);

  if (uploadLoteId) {
    persistUploadLoteAtivo(unidadeId, uploadLoteId);
  }

  return uploadLoteId;
}
