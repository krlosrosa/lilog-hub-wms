import { Button } from '@lilog/ui';
import { Crown, LogOut } from 'lucide-react';

import { useAuth } from '@/features/auth';

export function AccessDenied() {
  const { logout } = useAuth();

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
        <Crown className="h-8 w-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-headline-sm font-bold text-on-surface">Acesso Restrito</h1>
        <p className="max-w-xs text-body-md text-on-surface-variant">
          Este painel é exclusivo para líderes de turno. Fale com o administrador para
          solicitar acesso.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={() => {
          void logout();
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </Button>
    </div>
  );
}
