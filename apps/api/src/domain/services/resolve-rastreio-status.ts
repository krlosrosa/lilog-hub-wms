import type { PreRecebimentoSituacao } from '../model/recebimento/recebimento.model.js';

export function resolveRastreioSituacaoLabel(
  situacao: PreRecebimentoSituacao,
  docaNome: string | null,
): string {
  switch (situacao) {
    case 'agendado':
      return 'Aguardando chegada';
    case 'aguardando':
      return 'Aguarde informação de doca';
    case 'liberado_para_conferencia':
      return docaNome
        ? `Encoste o carro na ${docaNome}`
        : 'Aguardando chamada para doca';
    case 'em_conferencia':
      return docaNome
        ? `Conferência em andamento — ${docaNome}`
        : 'Conferência em andamento';
    case 'conferido':
      return 'Carga conferida — aguarde liberação';
    case 'finalizado':
      return 'Processo concluído — pode sair';
    case 'cancelado':
      return 'Agendamento cancelado';
    default:
      return 'Status indisponível';
  }
}

export function isRastreioFinalizado(situacao: PreRecebimentoSituacao): boolean {
  return situacao === 'finalizado' || situacao === 'cancelado';
}

export function resolvePwaBaseUrl(configService: {
  get: (key: string) => string | undefined;
}): string {
  const configured = configService.get('PWA_BASE_URL')?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const corsOrigin = configService.get('CORS_ORIGIN') ?? '';
  const pwaOrigin = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .find((origin) => origin.includes(':5174'));

  if (pwaOrigin) {
    return pwaOrigin.replace(/\/$/, '');
  }

  return 'http://localhost:5174';
}
