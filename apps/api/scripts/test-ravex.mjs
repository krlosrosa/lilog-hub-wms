import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.replace(/^"|"$/g, '');

const baseUrl = get('RAVEX_BASE_URL');
const username = get('RAVEX_USERNAME');
const password = get('RAVEX_PASSWORD');
const transportadoraId = process.argv[2] ?? '1';

async function main() {
  console.log('Auth URL:', `${baseUrl}/usuario/autenticar`);

  const formData = new FormData();
  formData.append('grant_type', 'password');
  formData.append('username', username);
  formData.append('password', password);

  const authRes = await fetch(`${baseUrl}/usuario/autenticar`, {
    method: 'POST',
    body: formData,
  });

  const authText = await authRes.text();
  console.log('Auth status:', authRes.status);
  console.log('Auth body:', authText.slice(0, 500));

  if (!authRes.ok) return;

  let token;
  try {
    token = JSON.parse(authText);
  } catch {
    console.log('Auth response is not JSON');
    return;
  }

  const accessToken = token.access_token ?? token.data?.access_token;
  console.log('Token keys:', Object.keys(token));
  console.log('Has access_token:', Boolean(accessToken));

  if (!accessToken) return;

  const listUrl = `${baseUrl}/api/hierarquia/transportadoras`;
  console.log('Transportadoras URL:', listUrl);
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const listText = await listRes.text();
  console.log('Transportadoras status:', listRes.status);
  console.log('Transportadoras body:', listText.slice(0, 800));

  const entidadeUrl = `${baseUrl}/api/entidade/transportadora/${transportadoraId}`;
  console.log('Entidade URL:', entidadeUrl);
  const entidadeRes = await fetch(entidadeUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const entidadeText = await entidadeRes.text();
  console.log('Entidade status:', entidadeRes.status);
  console.log('Entidade body:', entidadeText.slice(0, 1000));

  const veiculoUrl = `${baseUrl}/api/veiculo/transportadoraid/${transportadoraId}`;
  console.log('Veiculo URL:', veiculoUrl);

  const veiculoRes = await fetch(veiculoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const veiculoText = await veiculoRes.text();
  console.log('Veiculo status:', veiculoRes.status);
  console.log('Veiculo body:', veiculoText.slice(0, 1000));
}

main().catch(console.error);
