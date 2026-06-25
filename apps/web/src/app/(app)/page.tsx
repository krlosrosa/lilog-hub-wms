import { Button, ThemeToggle } from '@lilog/ui';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">lilog-hub-2027</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Monorepo + Next.js + shadcn/ui</h1>
        <p className="text-muted-foreground">
          Turborepo (pnpm workspaces) powering the web shell with <code className="font-mono">@lilog/ui</code>{' '}
          as an isolated UI package for future apps.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button>Hola monorepo</Button>
        <Button variant="secondary">Ghost route</Button>
        <Button variant="outline">Open docs soon</Button>
      </div>
    </main>
  );
}
