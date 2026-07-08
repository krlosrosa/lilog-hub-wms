import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { FEATURES, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Recursos',
  description: `Recursos da ${SITE_NAME}: recebimento, armazenagem, expedição, inventário, gestão operacional e mobilidade para equipes de logística empresarial.`,
  alternates: {
    canonical: '/recursos',
  },
};

export default function RecursosPage() {
  return (
    <PageShell
      title="Recursos da plataforma"
      description="Módulos corporativos para gestão logística completa, do recebimento à expedição, com visibilidade para gestores e produtividade para equipes operacionais."
    >
      <div className="grid gap-6">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Módulo {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{feature.title}</h2>
            <p className="mt-3 text-muted-foreground">{feature.description}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Automação de processos corporativos</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          A {SITE_NAME} integra fluxos operacionais, regras de processo e indicadores
          administrativos para empresas que precisam de controle profissional em
          operações logísticas. A plataforma foi projetada para ambientes empresariais,
          com separação clara entre site institucional, aplicação operacional e painel
          administrativo.
        </p>
      </section>
    </PageShell>
  );
}
