import { redirect } from 'next/navigation';

export default function RegrasCarregamentoRedirectPage() {
  redirect('/config-operacional/regras-produtividade?aba=carregamento');
}
