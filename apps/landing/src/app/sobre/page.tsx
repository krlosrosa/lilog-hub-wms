import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import { SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Sobre',
  description: `Conheça a ${SITE_NAME}, plataforma SaaS empresarial para gestão logística, operações de armazém e automação de processos corporativos.`,
  alternates: {
    canonical: '/sobre',
  },
};

export default function SobrePage() {
  return (
    <PageShell
      title={`Sobre a ${SITE_NAME}`}
      description="Software empresarial para centros de distribuição que exigem controle, rastreabilidade e padronização operacional."
    >
      <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Nossa solução</h2>
          <p>
            A {SITE_NAME} é uma plataforma SaaS de gestão logística e operações de
            armazém. O sistema foi desenvolvido para apoiar empresas que operam
            recebimento, armazenagem, inventário, separação e expedição em ambientes
            corporativos de alto volume.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Missão</h2>
          <p>
            Entregar tecnologia empresarial confiável para operações logísticas,
            aumentando a produtividade das equipes, a acuracidade de estoque e a
            visibilidade dos processos em centros de distribuição.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Visão</h2>
          <p>
            Ser referência em software de gestão logística para empresas que buscam
            automação de processos, governança operacional e escalabilidade em suas
            operações de armazém.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Público-alvo</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Empresas com centros de distribuição e operações logísticas internas</li>
            <li>Gestores, supervisores e equipes operacionais de armazém</li>
            <li>Organizações que necessitam de rastreabilidade e controle de estoque</li>
            <li>Operações corporativas com demanda por padronização e indicadores</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Segmento de atuação</h2>
          <p>
            Atuamos no segmento de software empresarial (Business and Economy), com foco
            em gestão logística, WMS e automação de processos operacionais para clientes
            profissionais.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
