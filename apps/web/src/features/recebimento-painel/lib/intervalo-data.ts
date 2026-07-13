export type IntervaloDataPainel = {
  dataInicio: string;
  dataFim: string;
};

export function formatarDataIso(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function criarIntervaloPadraoHoje(): IntervaloDataPainel {
  const hoje = formatarDataIso(new Date());
  return { dataInicio: hoje, dataFim: hoje };
}

export function normalizarIntervaloData(
  intervalo: IntervaloDataPainel,
): IntervaloDataPainel {
  if (intervalo.dataInicio <= intervalo.dataFim) {
    return intervalo;
  }

  return {
    dataInicio: intervalo.dataFim,
    dataFim: intervalo.dataInicio,
  };
}

export function intervaloParaIsoDatetime(
  intervalo: IntervaloDataPainel,
): { dataInicio: string; dataFim: string } {
  const normalizado = normalizarIntervaloData(intervalo);
  const inicio = new Date(`${normalizado.dataInicio}T00:00:00`);
  const fim = new Date(`${normalizado.dataFim}T23:59:59.999`);

  return {
    dataInicio: inicio.toISOString(),
    dataFim: fim.toISOString(),
  };
}

export function formatarRotuloIntervalo(intervalo: IntervaloDataPainel): string {
  const normalizado = normalizarIntervaloData(intervalo);
  if (normalizado.dataInicio === normalizado.dataFim) {
    return new Date(`${normalizado.dataInicio}T12:00:00`).toLocaleDateString(
      'pt-BR',
    );
  }

  const inicio = new Date(`${normalizado.dataInicio}T12:00:00`).toLocaleDateString(
    'pt-BR',
  );
  const fim = new Date(`${normalizado.dataFim}T12:00:00`).toLocaleDateString(
    'pt-BR',
  );
  return `${inicio} — ${fim}`;
}

export function intervaloValido(intervalo: IntervaloDataPainel): boolean {
  return Boolean(intervalo.dataInicio && intervalo.dataFim);
}
