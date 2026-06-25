import type { AvariaSelectOption } from '../components/avaria-select-field';

export const CONTAGEM_AVARIA_MOTIVO_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'embalagem_danificada', label: 'Embalagem danificada' },
  { value: 'produto_quebrado', label: 'Produto quebrado' },
  { value: 'umidade_mofo', label: 'Umidade / mofo' },
  { value: 'vencimento', label: 'Vencimento / validade' },
  { value: 'etiqueta_ilegivel', label: 'Etiqueta ilegível' },
  { value: 'contaminacao', label: 'Contaminação' },
  { value: 'outro', label: 'Outro' },
] as const;

export function getContagemAvariaMotivoLabel(value: string) {
  return (
    CONTAGEM_AVARIA_MOTIVO_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export const RECUPERACAO_CAUSA_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'armazenagem', label: 'Armazenagem' },
  { value: 'manuseio_interno', label: 'Manuseio Interno' },
  { value: 'defeito_fabricacao', label: 'Defeito Fabricação' },
] as const;

export const RECUPERACAO_DESTINO_OPTIONS: readonly AvariaSelectOption[] = [
  { value: 'estoque', label: 'Estoque' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'sucata', label: 'Sucata' },
  { value: 'devolucao_fornecedor', label: 'Devolução Fornecedor' },
] as const;

export function getRecuperacaoCausaLabel(value: string) {
  return (
    RECUPERACAO_CAUSA_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function getRecuperacaoDestinoLabel(value: string) {
  return (
    RECUPERACAO_DESTINO_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}
