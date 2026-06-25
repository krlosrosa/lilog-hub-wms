import { Button } from '@lilog/ui';
import { ShieldX } from 'lucide-react';

import { useAuth } from '@/features/auth';

export function AcessoNegadoView() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-margin-mobile py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-container/30 text-on-error-container">
        <ShieldX className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="mt-6 text-headline-lg-mobile font-bold text-on-surface">
        Acesso restrito
      </h1>
      <p className="mt-3 max-w-sm text-body-sm text-on-surface-variant">
        O app LILOG Liderança é exclusivo para perfis de gestão (admin e gerente).
        {user ? (
          <>
            {' '}
            Seu perfil atual é <strong className="text-on-surface">{user.role}</strong>.
          </>
        ) : null}
      </p>
      <Button
        type="button"
        onClick={() => void logout()}
        className="mt-8 h-12 min-w-[200px] rounded-lg text-body-md font-semibold"
      >
        Sair e usar outra conta
      </Button>
    </div>
  );
}
