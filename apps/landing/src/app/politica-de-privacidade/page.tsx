import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/page-shell';
import {
  COMPANY_ADDRESS_DISPLAY,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  SITE_NAME,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: `Política de privacidade da ${SITE_NAME}. Informações sobre coleta, uso e proteção de dados em conformidade com a LGPD.`,
  alternates: {
    canonical: '/politica-de-privacidade',
  },
};

export default function PoliticaPrivacidadePage() {
  return (
    <PageShell
      title="Política de Privacidade"
      description={`Última atualização: ${new Date().getFullYear()}. Esta política descreve como a ${SITE_NAME} trata dados pessoais em suas plataformas empresariais.`}
    >
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">1. Introdução</h2>
          <p>
            A {SITE_NAME} respeita a privacidade dos usuários de suas soluções de
            software empresarial para gestão logística. Esta Política de Privacidade
            explica como coletamos, utilizamos, armazenamos e protegemos dados pessoais
            em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
            13.709/2018).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">2. Controlador de dados</h2>
          <p>
            O controlador dos dados pessoais tratados nesta plataforma é a {SITE_NAME},
            com as seguintes informações de identificação:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Empresa / Produto: {SITE_NAME}</li>
            <li>Endereço: {COMPANY_ADDRESS_DISPLAY}</li>
            <li>
              E-mail:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>Telefone: {CONTACT_PHONE_DISPLAY}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">3. Dados coletados</h2>
          <p>Podemos tratar os seguintes tipos de dados, conforme o uso da plataforma:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Dados de identificação e contato (nome, e-mail, telefone corporativo)</li>
            <li>Dados de autenticação e acesso à aplicação</li>
            <li>Dados operacionais gerados no uso do sistema logístico</li>
            <li>Registros técnicos de acesso (logs, endereço IP, data e hora)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">4. Finalidade do tratamento</h2>
          <p>Os dados são utilizados para:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Prestação do serviço SaaS de gestão logística</li>
            <li>Autenticação, segurança e suporte técnico</li>
            <li>Cumprimento de obrigações legais e contratuais</li>
            <li>Melhoria contínua da plataforma empresarial</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">5. Compartilhamento</h2>
          <p>
            Não comercializamos dados pessoais. O compartilhamento ocorre apenas quando
            necessário para operação do serviço, cumprimento legal ou mediante consentimento
            do titular, sempre com medidas de segurança adequadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">6. Direitos do titular</h2>
          <p>
            Você pode solicitar confirmação de tratamento, acesso, correção, eliminação,
            portabilidade, revogação de consentimento e demais direitos previstos na LGPD,
            entrando em contato pelo e-mail{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">7. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger dados, incluindo
            comunicação via HTTPS, controles de acesso e monitoramento de ambientes
            corporativos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">8. Contato</h2>
          <p>
            Dúvidas sobre privacidade:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Consulte também nossos{' '}
            <Link href="/termos-de-uso" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
