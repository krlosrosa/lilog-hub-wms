import { redirect } from 'next/navigation';

export default function RegrasSeparacaoRedirectPage() {
  redirect('/config-operacional/regras-produtividade?aba=separacao');
}
