import type { ReactNode } from 'react';

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description ? (
            <p className="text-lg text-muted-foreground text-balance">{description}</p>
          ) : null}
        </header>
        {children}
      </div>
    </section>
  );
}
