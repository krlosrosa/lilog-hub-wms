import { redirect } from 'next/navigation';

export default function RegrasExpedicaoRedirectPage() {
  redirect('/config-operacional/regras-produtividade?aba=separacao');
}
