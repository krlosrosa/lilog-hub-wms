import { z } from 'zod';

export const PLACA_VEICULO_REGEX =
  /^[A-Z]{3}-?(\d{4}|\d[A-Z]\d{2})(-[A-Z]{2})?$/;

const PLACA_INVALIDA_LITERAL = new Set([
  'SEM PLACA',
  'SEMPLACA',
  'S/ PLACA',
  'S/PLACA',
]);

export function normalizarPlacaVeiculo(value: string): string {
  return value.trim().toUpperCase();
}

export function isPlacaVeiculoValida(value: string): boolean {
  const placa = normalizarPlacaVeiculo(value);

  if (!placa || PLACA_INVALIDA_LITERAL.has(placa.replace(/\s+/g, ' '))) {
    return false;
  }

  return PLACA_VEICULO_REGEX.test(placa);
}

export const PLACA_VEICULO_FORMATO_MENSAGEM =
  'Placa deve seguir o formato AAA9999, AAA9A99 ou com UF (ex.: ABC1234-SP, EZU5H23-MG)';

export const PlacaVeiculoSchema = z
  .string()
  .min(1, 'Informe a placa do veículo')
  .max(20)
  .transform((value) => normalizarPlacaVeiculo(value))
  .refine(isPlacaVeiculoValida, {
    message: PLACA_VEICULO_FORMATO_MENSAGEM,
  });
