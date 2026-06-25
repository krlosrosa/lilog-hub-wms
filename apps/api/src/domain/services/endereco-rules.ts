import {
  STRUCTURAL_ENDERECO_FIELDS,
  type StructuralEnderecoField,
  type UpdateEnderecoData,
} from '../model/endereco/endereco.model.js';
import type { EnderecoRecord } from '../repositories/endereco/endereco.repository.js';

export function hasStructuralChanges(
  existing: EnderecoRecord,
  data: UpdateEnderecoData,
): boolean {
  return STRUCTURAL_ENDERECO_FIELDS.some((field: StructuralEnderecoField) => {
    const value = data[field];
    if (value === undefined) {
      return false;
    }

    return String(existing[field]) !== String(value);
  });
}

export function isEnderecoOperacional(status: EnderecoRecord['status']): boolean {
  return status !== 'inativo';
}

export function canReceiveMovimentacao(status: EnderecoRecord['status']): boolean {
  return status === 'disponivel' || status === 'ocupado';
}
