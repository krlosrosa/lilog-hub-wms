import type { IntervaloData } from '@/features/torre-controle-expedicao/lib/intervalo-data';

const STORAGE_KEY = 'lilog:torre-controle-filtro';

type TorreControleFiltroPorUnidade = Record<
  string,
  IntervaloData & { uploadLoteId?: string }
>;

function readAll(): TorreControleFiltroPorUnidade {
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

    return parsed as TorreControleFiltroPorUnidade;
  } catch {
    return {};
  }
}

function writeAll(data: TorreControleFiltroPorUnidade) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readTorreControleFiltro(unidadeId: string) {
  return readAll()[unidadeId] ?? null;
}

export function persistTorreControleFiltro(
  unidadeId: string,
  filtro: IntervaloData & { uploadLoteId?: string },
): void {
  const atual = readAll();
  atual[unidadeId] = filtro;
  writeAll(atual);
}
