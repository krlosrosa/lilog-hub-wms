import type { ArmazenagemItemStatus } from '../types/armazenagem.schema';

export interface QuantidadeArmazenagem {
  caixas: number;
  unidades: number;
}

export function isArmazenagemParcial(
  solicitado: QuantidadeArmazenagem,
  guardado: QuantidadeArmazenagem
): boolean {
  const cx = Number(guardado.caixas) || 0;
  const un = Number(guardado.unidades) || 0;
  const solCx = Number(solicitado.caixas) || 0;
  const solUn = Number(solicitado.unidades) || 0;

  if (cx === 0 && un === 0) return false;

  return cx < solCx || un < solUn;
}

export function isArmazenagemCompleta(
  solicitado: QuantidadeArmazenagem,
  guardado: QuantidadeArmazenagem
): boolean {
  const cx = Number(guardado.caixas) || 0;
  const un = Number(guardado.unidades) || 0;
  const solCx = Number(solicitado.caixas) || 0;
  const solUn = Number(solicitado.unidades) || 0;

  return cx >= solCx && un >= solUn && (cx > 0 || un > 0);
}

export function computeArmazenagemStatus(
  solicitado: QuantidadeArmazenagem,
  guardado: QuantidadeArmazenagem
): ArmazenagemItemStatus {
  if (isArmazenagemCompleta(solicitado, guardado)) return 'guardado';
  if (isArmazenagemParcial(solicitado, guardado)) return 'parcial';
  return 'guardado';
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
  solicitado: QuantidadeArmazenagem,
  guardado: QuantidadeArmazenagem
): string {
  return `${formatQuantidadeResumo(guardado.caixas, guardado.unidades)} de ${formatQuantidadeResumo(solicitado.caixas, solicitado.unidades)}`;
}
