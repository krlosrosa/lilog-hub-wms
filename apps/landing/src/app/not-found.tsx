import Link from 'next/link';

import { Button } from '@lilog/ui';

import { SITE_NAME } from '@/lib/site-config';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-container flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-primary">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        A página solicitada não existe no site institucional da {SITE_NAME}. Verifique o
        endereço ou retorne à página inicial.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </section>
  );
}
