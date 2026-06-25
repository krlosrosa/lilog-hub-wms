import type {
  AreaChecklist,
  EvidenciaFoto,
  HandoverNota,
  PassagemBastaoAuditoria,
  PassagemBastaoKpis,
  RackItem,
} from '@/features/passagem-bastao/types/passagem-bastao.schema';
import { DEFAULT_AUDITORIA } from '@/features/passagem-bastao/types/passagem-bastao.schema';

export const MOCK_AUDITORIA: PassagemBastaoAuditoria = DEFAULT_AUDITORIA;

export const MOCK_KPIS: PassagemBastaoKpis = {
  indiceLimpezaPercent: 92.5,
  indiceLimpezaDelta: '+1.2% em relação ao turno anterior',
  zonasCriticas: 4,
  integridadeLabel: 'Estável',
  integridadePercent: 88,
};

export const MOCK_CHECKLIST_AREAS: AreaChecklist[] = [
  {
    id: 'area-1',
    area: 'DOCAS_ZONA_LESTE',
    status: 'limpo',
    responsavel: 'Equipe A - Manhã',
    ultimaAuditoria: '13:45',
  },
  {
    id: 'area-2',
    area: 'CORREDOR_G_12-24',
    status: 'sujo',
    responsavel: 'Pendente Atribuição',
    ultimaAuditoria: '14:10',
  },
  {
    id: 'area-3',
    area: 'REFEITÓRIO_NÍVEL_2',
    status: 'pendente',
    responsavel: 'Serviços Gerais Terc.',
    ultimaAuditoria: '14:05',
  },
  {
    id: 'area-4',
    area: 'BANHEIROS_BLOCOC',
    status: 'limpo',
    responsavel: 'Equipe B - Manhã',
    ultimaAuditoria: '13:30',
  },
];

export const MOCK_RACKS: RackItem[] = [
  {
    id: 'rack-1',
    setor: 'Setor A - Racks 01-50',
    descricao: 'Inspeção Visual OK • Sem Danos',
    status: 'ok',
    detalhe: 'Inspeção Visual OK • Sem Danos',
  },
  {
    id: 'rack-2',
    setor: 'Setor C - Travessa Amassada',
    descricao: 'Rack C-24-3 • Manutenção Solicitada',
    status: 'critico',
    detalhe: 'Rack C-24-3 • Manutenção Solicitada',
  },
];

export const MOCK_EVIDENCIAS: EvidenciaFoto[] = [
  {
    id: 'ev-1',
    label: 'Derramamento Corredor 12',
    tipo: 'antes',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAXH9aSwF1QcuG-VDJJcWMPg8PnrsyxDSShf9dNCIL3tyteWZPcJIR8ULwFlvrp9htv4NFnINavO5WPOAVrZW-xO0LhFM6FpQ-ehTuz5YY8roNllHo62dbfQkMY5j_z0RPqmAZzU-a2Ab-zwoaeQC3yC9xphtnzSqL7brgbzl7HSTat0cASI_xNUINtxMzuqL6CFGpl2pQxTSvEEC-LW90NrE5riO_JbbKRftCRLst_f9EbuUWEB1QF5VE1ppVCsWkE5J7Jb5DrwA',
  },
  {
    id: 'ev-2',
    label: 'Limpeza Concluída 14:15',
    tipo: 'depois',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDPD8VFxQndKaFMs28pfcnVbC4zdKIDPSHuAR7ZwnEl2ffRvXRNleGjTT6s3am9Blf8aW-2neS8mkZeri8ymORAgmFB98JgRxV0vnrDNXtUONcJc21FmE5lu_IgaHRr4gLl4lqbYKAEcziq-nhGiTC6VpYcVE8z6-N4jfVDOyHElArNz_w0fo-_Bs9xUm2k3ppicDHLodGRCDhoPR08zM4mJjn0CuTRpZ3nSqOyft6qJl6hB2t4u3dlBem0OyF5RO_Gsf3OHlKgebs',
  },
];

export const MOCK_HANDOVER_NOTA: HandoverNota = {
  id: 'nota-1',
  supervisor: 'Roberto Mendes',
  cargo: 'Encarregado Predial Alpha',
  turno: 'Shift Alpha',
  mensagem:
    'O corredor 12 teve um derramamento de óleo às 13:50. A equipe já realizou a limpeza pesada, mas o piso ainda está úmido e com sinalização de perigo. Por favor, manter o isolamento até as 16:00 para secagem completa. As lixeiras da Doca Leste precisam de coleta extra devido ao volume de papelão.',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBIU9WZfR5AMSgiwicBvI6Ib0-XNi6fV3DvTvLJQoqE_1uqwpGvVd7l7QIoVeMWrZQsgz7sunUVsQBkqYG1NR6EjMZp-2nwxLRou3voBwPLd3H2K7yPbf3eNoBoFDB8L9KduMroBqDtyhRyVSy6KFfQQyCfb6jYsr9Y7UBwqdRlk9A9UiOK0H9n2e1uO9W0_uNCv9bQU0Z2TuJ7qfUx1W0pPKgzNXXuPR8AnpyMgEW5Rh5qRQmDujSoWqNXI6o_S1WkgTo5DGgDLQo',
};
