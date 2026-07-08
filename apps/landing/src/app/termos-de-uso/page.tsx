import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/page-shell';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: `Termos de uso da plataforma ${SITE_NAME}. Condições de acesso e utilização do software empresarial de gestão logística.`,
  alternates: {
    canonical: '/termos-de-uso',
  },
};

export default function TermosDeUsoPage() {
  return (
    <PageShell
      title="Termos de Uso"
      description={`Condições gerais para utilização das soluções empresariais ${SITE_NAME}.`}
    >
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">1. Aceitação</h2>
          <p>
            Ao acessar o site institucional ou utilizar a plataforma {SITE_NAME}, você
            concorda com estes Termos de Uso. Caso não concorde, interrompa o uso do
            serviço.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">2. Descrição do serviço</h2>
          <p>
            A {SITE_NAME} oferece software SaaS para gestão logística e operações de
            armazém, incluindo módulos de recebimento, armazenagem, inventário, expedição
            e gestão operacional corporativa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">3. Uso permitido</h2>
          <p>O usuário compromete-se a:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Utilizar a plataforma apenas para fins empresariais legítimos</li>
            <li>Manter credenciais de acesso em sigilo</li>
            <li>Não tentar comprometer a segurança ou disponibilidade do sistema</li>
            <li>Fornecer informações verdadeiras quando solicitado</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">4. Propriedade intelectual</h2>
          <p>
            Todo o conteúdo, marca, software e documentação da {SITE_NAME} são protegidos
            por direitos de propriedade intelectual. É vedada a reprodução não autorizada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">5. Disponibilidade</h2>
          <p>
            Empregamos esforços comerciais razoáveis para manter a plataforma disponível.
            Manutenções programadas ou indisponibilidades temporárias podem ocorrer, com
            comunicação quando aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">6. Limitação de responsabilidade</h2>
          <p>
            A {SITE_NAME} não se responsabiliza por danos indiretos decorrentes do uso
            indevido da plataforma ou de integrações não autorizadas, dentro dos limites
            permitidos pela legislação aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">7. Privacidade</h2>
          <p>
            O tratamento de dados pessoais é regido pela nossa{' '}
            <Link
              href="/politica-de-privacidade"
              className="text-primary hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">8. Contato</h2>
          <p>
            Para questões sobre estes termos:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
