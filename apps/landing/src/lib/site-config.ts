export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://logistica-processo.com';

export const SITE_NAME = 'LiLog';

export const SITE_TAGLINE =
  'Plataforma SaaS de Gestão Logística e Operações de Armazém';

export const SITE_DESCRIPTION =
  'Sistema empresarial para gerenciamento de estoque, recebimento, separação, expedição e processos logísticos em centros de distribuição e operações corporativas.';

export const SITE_KEYWORDS = [
  'LiLog',
  'WMS',
  'gestão logística',
  'software empresarial',
  'operações de armazém',
  'centro de distribuição',
  'recebimento de mercadorias',
  'expedição',
  'inventário',
  'automação logística',
  'SaaS logística',
  'Business and Economy',
];

export const CONTACT_EMAIL = 'uppaplicativo@gmail.com';

export const CONTACT_PHONE = '+5521979617942';

export const CONTACT_PHONE_DISPLAY = '+55 21 97961-7942';

export const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.logistica-processo.com';

export const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/sobre', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/recursos', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/contato', changeFrequency: 'monthly' as const, priority: 0.7 },
  {
    path: '/politica-de-privacidade',
    changeFrequency: 'yearly' as const,
    priority: 0.4,
  },
  { path: '/termos-de-uso', changeFrequency: 'yearly' as const, priority: 0.4 },
];

export const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/recursos', label: 'Recursos' },
  { href: '/contato', label: 'Contato' },
];

export const FEATURES = [
  {
    title: 'Recebimento e Conferência',
    description:
      'Controle de entrada de mercadorias com conferência operacional, rastreabilidade e integração com processos de armazenagem.',
  },
  {
    title: 'Armazenagem Inteligente',
    description:
      'Endereçamento, movimentação interna e gestão de posições para maximizar a produtividade do centro de distribuição.',
  },
  {
    title: 'Expedição e Separação',
    description:
      'Orquestração de pedidos, separação por ondas e expedição com visibilidade em tempo real para equipes operacionais.',
  },
  {
    title: 'Inventário e Estoque',
    description:
      'Contagens cíclicas, ajustes controlados e indicadores de acuracidade para operações corporativas de alto volume.',
  },
  {
    title: 'Gestão Operacional',
    description:
      'Painéis administrativos, regras de processo e automação para supervisores e gestores de logística.',
  },
  {
    title: 'Mobilidade em Campo',
    description:
      'Aplicativos operacionais para equipes de chão de fábrica e liderança, conectados ao mesmo ecossistema empresarial.',
  },
];
