import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import { generateGetPresignedUrl } from '../../../infra/clients/r2/r2-presign.js';

const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 60 * 60;

export async function resolveAvariaPhotoUrls(
  documentoRepository: IDocumentoRepository,
  r2Config: R2Config | null,
  photoRefs: string[],
): Promise<string[]> {
  if (photoRefs.length === 0 || !r2Config) {
    return [];
  }

  const resolved: string[] = [];

  for (const photoRef of photoRefs) {
    if (photoRef.startsWith('http://') || photoRef.startsWith('https://')) {
      resolved.push(photoRef);
      continue;
    }

    const documento = await documentoRepository.findByChave(photoRef);

    if (!documento || documento.status !== 'ativo') {
      continue;
    }

    const downloadUrl = await generateGetPresignedUrl(
      r2Config.client,
      r2Config.bucketName,
      documento.chave,
      DOWNLOAD_URL_EXPIRES_IN_SECONDS,
    );

    resolved.push(downloadUrl);
  }

  return resolved;
}
