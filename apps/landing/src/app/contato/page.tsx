import type { Metadata } from 'next';

import { PageShell } from '@/components/page-shell';
import {
  ADMIN_URL,
  COMPANY_ADDRESS_DISPLAY,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  SITE_NAME,
} from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Entre em contato com a equipe ${SITE_NAME} para demonstrações, implantação e suporte comercial da plataforma de gestão logística empresarial.`,
  alternates: {
    canonical: '/contato',
  },
};

export default function ContatoPage() {
  return (
    <PageShell
      title="Contato comercial"
      description="Fale com nossa equipe para conhecer a plataforma, solicitar demonstração ou obter informações sobre implantação em sua operação logística."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Informações de contato</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">Empresa / Produto</dt>
              <dd className="text-muted-foreground">{SITE_NAME}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">E-mail</dt>
              <dd>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Telefone</dt>
              <dd>
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Endereço</dt>
              <dd className="text-muted-foreground">{COMPANY_ADDRESS_DISPLAY}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Segmento</dt>
              <dd className="text-muted-foreground">
                Software empresarial · Gestão logística · Business and Economy
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Acesso à aplicação</dt>
              <dd>
                <a href={ADMIN_URL} className="text-primary hover:underline">
                  {ADMIN_URL}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-muted/20 p-6">
          <h2 className="text-lg font-semibold">Solicitação de contato</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Para solicitar demonstração ou proposta comercial, envie um e-mail com o
            nome da empresa, volume operacional estimado e principais processos
            logísticos que deseja automatizar.
          </p>
          <form
            action={`mailto:${CONTACT_EMAIL}?subject=Contato%20comercial%20-%20LiLog`}
            method="post"
            encType="text/plain"
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="empresa" className="text-sm font-medium">
                Empresa
              </label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="mensagem" className="text-sm font-medium">
                Mensagem
              </label>
              <textarea
                id="mensagem"
                name="mensagem"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Descreva sua operação logística e necessidades"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Enviar por e-mail
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
