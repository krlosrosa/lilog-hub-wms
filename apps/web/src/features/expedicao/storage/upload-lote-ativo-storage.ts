const STORAGE_KEY = 'lilog:expedicao-upload-lote-ativo';

type UploadLoteAtivoPorUnidade = Record<
  string,
  {
    uploadLoteId: string;
    updatedAt: string;
  }
>;

function readAll(): UploadLoteAtivoPorUnidade {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as UploadLoteAtivoPorUnidade;
  } catch {
    return {};
  }
}

function writeAll(data: UploadLoteAtivoPorUnidade) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function persistUploadLoteAtivo(
  unidadeId: string,
  uploadLoteId: string,
): void {
  const atual = readAll();
  atual[unidadeId] = {
    uploadLoteId,
    updatedAt: new Date().toISOString(),
  };
  writeAll(atual);
}

export function readUploadLoteAtivo(unidadeId: string): string | null {
  return readAll()[unidadeId]?.uploadLoteId ?? null;
}

export function clearUploadLoteAtivo(unidadeId: string): void {
  const atual = readAll();
  delete atual[unidadeId];
  writeAll(atual);
}
