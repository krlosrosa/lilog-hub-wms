export type MontarHtmlCodigoPortalInput = {
  transportadoraNome: string;
  codigo: string;
  expiracaoMinutos: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function montarHtmlCodigoPortal(input: MontarHtmlCodigoPortalInput): string {
  const nome = escapeHtml(input.transportadoraNome);
  const codigo = escapeHtml(input.codigo);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; background: #f8f7fc; color: #1c1b1f; padding: 24px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e1ec; border-radius: 16px; padding: 32px;">
      <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6780;">
        Portal de Terceiros
      </p>
      <h1 style="margin: 0 0 16px; font-size: 24px;">Seu código de acesso</h1>
      <p style="margin: 0 0 24px; line-height: 1.5;">
        Olá, <strong>${nome}</strong>. Use o código abaixo para acessar o portal:
      </p>
      <div style="margin: 0 0 24px; padding: 20px; border-radius: 12px; background: #f3f0ff; text-align: center;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 0.35em;">${codigo}</span>
      </div>
      <p style="margin: 0; line-height: 1.5; color: #6b6780;">
        Este código expira em ${input.expiracaoMinutos} minutos. Se você não solicitou este acesso, ignore este e-mail.
      </p>
    </div>
  </body>
</html>
  `.trim();
}

export function montarTextoCodigoPortal(input: MontarHtmlCodigoPortalInput): string {
  return [
    'Portal de Terceiros',
    '',
    `Olá, ${input.transportadoraNome}.`,
    '',
    `Seu código de acesso: ${input.codigo}`,
    '',
    `Este código expira em ${input.expiracaoMinutos} minutos.`,
  ].join('\n');
}
