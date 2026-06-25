import {
  ClipboardList,
  FileText,
  Package,
  Truck,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/usuarios/components/usuario-form-field-classes';
import type {
  PermissaoAcaoKey,
  PermissaoModulo,
} from '@/features/usuarios/types/usuarios-perfis.schema';
import { PERMISSAO_ACAO_LABELS } from '@/features/usuarios/types/usuarios-perfis.schema';

const iconMap = {
  inventory_2: Package,
  call_received: Truck,
  local_shipping: Truck,
  description: FileText,
} as const;

type PermissaoMatrixProps = {
  modulos: PermissaoModulo[];
  onTogglePermissao: (
    moduloId: string,
    acao: PermissaoAcaoKey,
    value: boolean,
  ) => void;
  onDescartar: () => void;
  onSalvar: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
};

export function PermissaoMatrix({
  modulos,
  onTogglePermissao,
  onDescartar,
  onSalvar,
  isSaving = false,
  hasChanges = false,
}: PermissaoMatrixProps) {
  return (
    <div className={cn(glassPanelClassName, 'overflow-hidden')}>
      <div className="grid grid-cols-12 border-b border-outline-variant bg-surface-highest/50 px-2 py-1.5">
        <div className="col-span-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Módulo
        </div>
        {(['ver', 'criar', 'editar', 'excluir'] as PermissaoAcaoKey[]).map(
          (acao) => (
            <div
              key={acao}
              className="col-span-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {PERMISSAO_ACAO_LABELS[acao]}
            </div>
          ),
        )}
      </div>

      <div className="divide-y divide-outline-variant/30">
        {modulos.map((modulo) => {
          const Icon =
            iconMap[modulo.icon as keyof typeof iconMap] ?? ClipboardList;

          return (
            <div
              key={modulo.id}
              className="group transition-colors hover:bg-surface-highest/50"
            >
              <div className="grid grid-cols-12 items-center px-2 py-1.5">
                <div className="col-span-4 flex min-w-0 items-center gap-2">
                  <Icon
                    className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-foreground">
                      {modulo.nome}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {modulo.descricao}
                    </p>
                  </div>
                </div>
                {(['ver', 'criar', 'editar', 'excluir'] as PermissaoAcaoKey[]).map(
                  (acao) => (
                    <div key={acao} className="col-span-2 flex justify-center">
                      <input
                        type="checkbox"
                        checked={modulo.permissoes[acao]}
                        onChange={(e) =>
                          onTogglePermissao(modulo.id, acao, e.target.checked)
                        }
                        aria-label={`${PERMISSAO_ACAO_LABELS[acao]} — ${modulo.nome}`}
                        className="size-3.5 rounded border-outline-variant bg-surface-highest text-primary focus:ring-primary"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center text-[11px] text-muted-foreground">
          <FileText className="mr-1.5 size-3.5" aria-hidden />
          Alterações registradas para auditoria.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDescartar}
            disabled={!hasChanges || isSaving}
            className="rounded-md px-3 py-1.5 text-[11px] text-foreground transition-colors hover:text-primary disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onSalvar}
            disabled={isSaving}
            className="rounded-md bg-tertiary px-4 py-1.5 text-[11px] font-bold text-on-tertiary transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {isSaving ? 'Salvando…' : 'Salvar Permissões'}
          </button>
        </div>
      </div>
    </div>
  );
}
