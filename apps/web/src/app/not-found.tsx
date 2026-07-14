import Link from 'next/link';

import { Button } from '@lilog/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Verifique o endereço ou volte para o painel inicial.
      </p>
      <Button asChild>
        <Link href="/">Ir para o início</Link>
      </Button>
    </div>
  );
}
