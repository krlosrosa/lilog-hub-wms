'use client';

import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import type { EnderecoTipo } from '@/features/enderecos/types/enderecos-gestao.schema';
import { ProdutoSelectorCombobox } from '@/features/produto-endereco/components/produto-selector-combobox';
import {
  PAPEL_PRODUTO_ENDERECO_LABELS,
  type ProdutoEnderecoPapelForm,
  type SlottingEnderecoLinha,
} from '@/features/produto-endereco/types/produto-endereco.schema';
import type { ProdutoApi } from '@/features/produto/types/produto.api';

const inlineSelectClassName =
  'h-8 w-full min-w-[8rem] rounded-md border border-outline-variant/60 bg-surface-low px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

const inlineNumberClassName =
  'h-8 w-16 rounded-md border border-outline-variant/60 bg-surface-low px-2 text-center text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

type SlottingEnderecoRowProps = {
  linha: SlottingEnderecoLinha;
  disabled?: boolean;
  onSelectProduto: (enderecoId: string, produto: ProdutoApi) => void;
  onClearProduto: (enderecoId: string) => void;
  onChangePapel: (enderecoId: string, papel: ProdutoEnderecoPapelForm) => void;
  onChangeOrdem: (enderecoId: string, ordem: number) => void;
  onConfirmOrdem: (enderecoId: string) => void;
  onChangeAtivo: (enderecoId: string, ativo: boolean) => void;
};

export function SlottingEnderecoRow({
  linha,
  disabled = false,
  onSelectProduto,
  onClearProduto,
  onChangePapel,
  onChangeOrdem,
  onConfirmOrdem,
  onChangeAtivo,
}: SlottingEnderecoRowProps) {
  const { enderecoId, enderecoMascarado, zona, rua, tipo, draft, isDirty, isSaving } =
    linha;

  const tipoLabel =
    ENDERECO_TIPO_LABELS[tipo as EnderecoTipo] ?? tipo;

  return (
    <tr
      className={cn(
        compactTableRowClassName,
        isDirty && 'bg-primary/[0.03]',
        isSaving && 'opacity-80',
      )}
    >
      <td className={cn(compactTableCellClassName, 'font-mono text-[11px] font-semibold')}>
        {enderecoMascarado}
      </td>
      <td className={cn(compactTableCellClassName, 'text-[11px] text-muted-foreground')}>
        {zona} / {rua}
      </td>
      <td className={compactTableCellClassName}>
        <span className="inline-flex rounded-md bg-surface-highest px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {tipoLabel}
        </span>
      </td>
      <td className={compactTableCellClassName}>
        <ProdutoSelectorCombobox
          produtoId={draft.produtoId}
          produtoSku={draft.produtoSku}
          produtoDescricao={draft.produtoDescricao}
          disabled={disabled}
          isSaving={isSaving}
          onSelect={(produto) => onSelectProduto(enderecoId, produto)}
          onClear={() => onClearProduto(enderecoId)}
        />
      </td>
      <td className={compactTableCellClassName}>
        <select
          value={draft.papel}
          disabled={disabled || isSaving || !draft.produtoId}
          className={inlineSelectClassName}
          onChange={(event) =>
            onChangePapel(enderecoId, event.target.value as ProdutoEnderecoPapelForm)
          }
        >
          {(Object.keys(PAPEL_PRODUTO_ENDERECO_LABELS) as ProdutoEnderecoPapelForm[]).map(
            (key) => (
              <option key={key} value={key}>
                {PAPEL_PRODUTO_ENDERECO_LABELS[key]}
              </option>
            ),
          )}
        </select>
      </td>
      <td className={compactTableCellClassName}>
        <input
          type="number"
          min={1}
          max={32767}
          value={draft.ordem}
          disabled={disabled || isSaving || !draft.produtoId}
          className={inlineNumberClassName}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(parsed)) {
              onChangeOrdem(enderecoId, parsed);
            }
          }}
          onBlur={() => onConfirmOrdem(enderecoId)}
        />
      </td>
      <td className={compactTableCellClassName}>
        <label className="inline-flex items-center gap-1.5 text-[11px]">
          <input
            type="checkbox"
            checked={draft.ativo}
            disabled={disabled || isSaving || !draft.produtoId}
            onChange={(event) => onChangeAtivo(enderecoId, event.target.checked)}
            className="size-3.5 rounded border-outline-variant"
          />
          {draft.ativo ? 'Ativo' : 'Inativo'}
        </label>
      </td>
    </tr>
  );
}
