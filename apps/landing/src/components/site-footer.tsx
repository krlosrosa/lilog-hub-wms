import Link from 'next/link';

import {
  COMPANY_ADDRESS_DISPLAY,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  NAV_LINKS,
  SITE_NAME,
  SITE_TAGLINE,
} from '@/lib/site-config';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-lg font-semibold">{SITE_NAME}</p>
            <p className="text-sm text-muted-foreground">{SITE_TAGLINE}</p>
            <p className="text-sm text-muted-foreground">
              Software empresarial para centros de distribuição, operações logísticas e
              automação de processos corporativos.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Institucional</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/politica-de-privacidade" className="hover:text-foreground">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="hover:text-foreground">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Contato</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_PHONE}`} className="hover:text-foreground">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li>{COMPANY_ADDRESS_DISPLAY}</li>
              <li>Segmento: Business and Economy / Software Empresarial</li>
              <li>Público-alvo: empresas de logística e operações de armazém</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {currentYear} {SITE_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
