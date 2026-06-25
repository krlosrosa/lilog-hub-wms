import type { SeparacaoItemStatus } from '../types/separacao.schema';

export interface QuantidadeSeparacao {
  caixas: number;
  unidades: number;
}

export function isSeparacaoParcial(
  solicitado: QuantidadeSeparacao,
  separado: QuantidadeSeparacao
): boolean {
  const cx = Number(separado.caixas) || 0;
  const un = Number(separado.unidades) || 0;
  const solCx = Number(solicitado.caixas) || 0;
  const solUn = Number(solicitado.unidades) || 0;

  if (cx === 0 && un === 0) return false;

  return cx < solCx || un < solUn;
}

export function isSeparacaoCompleta(
  solicitado: QuantidadeSeparacao,
  separado: QuantidadeSeparacao
): boolean {
  const cx = Number(separado.caixas) || 0;
  const un = Number(separado.unidades) || 0;
  const solCx = Number(solicitado.caixas) || 0;
  const solUn = Number(solicitado.unidades) || 0;

  return cx >= solCx && un >= solUn && (cx > 0 || un > 0);
}

export function computeSeparacaoStatus(
  solicitado: QuantidadeSeparacao,
  separado: QuantidadeSeparacao,
  esgotado: boolean
): SeparacaoItemStatus {
  if (esgotado) return 'esgotado';
  if (isSeparacaoCompleta(solicitado, separado)) return 'separado';
  if (isSeparacaoParcial(solicitado, separado)) return 'parcial';
  return 'separado';
}

export function formatQuantidadeResumo(
  caixas: number,
  unidades: number
): string {
  const parts: string[] = [];
  if (caixas > 0) parts.push(`${caixas} cx`);
  if (unidades > 0) parts.push(`${unidades} un`);
  return parts.length > 0 ? parts.join(' + ') : '0';
}

export function formatQuantidadeComparacao(
  solicitado: QuantidadeSeparacao,
  separado: QuantidadeSeparacao
): string {
  return `${formatQuantidadeResumo(separado.caixas, separado.unidades)} de ${formatQuantidadeResumo(solicitado.caixas, solicitado.unidades)}`;
}
