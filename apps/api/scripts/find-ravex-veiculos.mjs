import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.replace(/^"|"$/g, '');
const baseUrl = get('RAVEX_BASE_URL');
const username = get('RAVEX_USERNAME');
const password = get('RAVEX_PASSWORD');

async function auth() {
  const formData = new FormData();
  formData.append('grant_type', 'password');
  formData.append('username', username);
  formData.append('password', password);
  const res = await fetch(`${baseUrl}/usuario/autenticar`, { method: 'POST', body: formData });
  return (await res.json()).access_token;
}

async function main() {
  const token = await auth();
  const listRes = await fetch(`${baseUrl}/api/hierarquia/transportadoras`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await listRes.json();
  const all = list.data ?? [];
  const matches = all.filter((t) =>
    /transport|lactalis|logist|frete|carga/i.test(t.nome),
  );
  console.log('Matches:', matches.slice(0, 20));

  for (const t of matches.slice(0, 15)) {
    const res = await fetch(`${baseUrl}/api/veiculo/transportadoraid/${t.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (body.data?.length > 0) {
      console.log('WITH VEHICLES', t.id, t.nome, body.data.length);
      console.log(JSON.stringify(body.data[0], null, 2));
      return;
    }
  }
  console.log('Checked', matches.length, 'matches, none with vehicles');
}

main();
