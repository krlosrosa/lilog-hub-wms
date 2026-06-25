import { redirect } from 'next/navigation';

export default function RegrasConferenciaRedirectPage() {
  redirect('/config-operacional/regras-produtividade?aba=conferencia');
}
