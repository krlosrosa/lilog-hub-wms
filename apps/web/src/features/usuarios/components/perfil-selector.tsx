import {
  BarChart3,
  ShieldCheck,
  UserCog,
  Wrench,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/usuarios/components/usuario-form-field-classes';
import type { PerfilRole } from '@/features/usuarios/types/usuarios-perfis.schema';
import type { UsuarioPerfil } from '@/features/usuarios/types/usuarios-gestao.schema';

const iconMap = {
  verified_user: ShieldCheck,
  manage_accounts: UserCog,
  analytics: BarChart3,
  precision_manufacturing: Wrench,
} as const;

type PerfilSelectorProps = {
  perfis: PerfilRole[];
  perfilSelecionado: UsuarioPerfil;
  onSelectPerfil: (perfilId: UsuarioPerfil) => void;
  healthScore?: number;
};

export function PerfilSelector({
  perfis,
  perfilSelecionado,
  onSelectPerfil,
  healthScore,
}: PerfilSelectorProps) {
  const perfilAtivo = perfis.find((p) => p.id === perfilSelecionado);
  const score = healthScore ?? perfilAtivo?.healthScore ?? 0;

  return (
    <div className="space-y-3">
      <div className={cn(glassPanelClassName, 'p-2')}>
        {perfis.map((perfil) => {
          const Icon = iconMap[perfil.icon as keyof typeof iconMap] ?? ShieldCheck;
          const isActive = perfil.id === perfilSelecionado;

          return (
            <button
              key={perfil.id}
              type="button"
              onClick={() => onSelectPerfil(perfil.id)}
              className={cn(
                'mb-1 flex w-full items-center rounded-xl p-3 transition-all last:mb-0',
                isActive
                  ? 'border border-primary/20 bg-surface-highest text-primary shadow-inner-glow'
                  : 'text-muted-foreground hover:bg-surface-high',
              )}
            >
              <div
                className={cn(
                  'mr-3 flex size-10 items-center justify-center rounded-lg',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-surface-high',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="text-left">
                <p className="text-label-md font-bold">{perfil.label}</p>
                <p className="text-xs text-muted-foreground">{perfil.descricao}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className={cn(glassPanelClassName, 'p-6')}>
        <h4 className="mb-2 text-label-md font-bold text-foreground">
          Score de Saúde da Função
        </h4>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-highest">
            <div
              className="h-full bg-tertiary transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="font-mono text-xs text-tertiary">{score}%</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Segurança em conformidade e baixo sobreposição redundante.
        </p>
      </div>
    </div>
  );
}
