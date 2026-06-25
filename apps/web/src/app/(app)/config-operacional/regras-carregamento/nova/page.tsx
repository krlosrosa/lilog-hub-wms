import { redirect } from 'next/navigation';

export default function RegrasCarregamentoNovaRedirectPage() {
  redirect('/config-operacional/regras-produtividade/nova?tipo=carregamento');
}
