import { redirect } from 'next/navigation';

export default function RegrasConferenciaNovaRedirectPage() {
  redirect('/config-operacional/regras-produtividade/nova?tipo=conferencia');
}
