import { redirect } from 'next/navigation';

export default function RegrasSeparacaoNovaRedirectPage() {
  redirect('/config-operacional/regras-produtividade/nova?tipo=separacao');
}
