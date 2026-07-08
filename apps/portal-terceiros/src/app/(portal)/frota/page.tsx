import { Wrench } from 'lucide-react';

export default function FrotaPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Gestão de Frota
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Veículos, manutenção, revisões e checklists operacionais.
        </p>
      </header>

      <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Wrench className="size-6" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">
          Esta seção será disponibilizada em breve.
        </p>
      </section>
    </div>
  );
}
