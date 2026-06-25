import type {
  FuncionarioKpi,
  FuncionarioRecord,
} from '@/features/funcionarios/types/funcionarios-gestao.schema';

export const MOCK_FUNCIONARIO_KPI: FuncionarioKpi = {
  totalFuncionarios: 1284,
  totalFuncionariosTrendPercent: 4.2,
  totalFuncionariosProgress: 85,
  produtividadeMedia: 92.4,
  produtividadeMediaTrendPercent: 1.8,
  produtividadeMediaProgress: 92,
  horarioMedioOperacao: '7.45h',
  horarioMedioTrendPercent: 1.2,
  horarioMedioProgress: 78,
};

export const MOCK_FUNCIONARIOS: FuncionarioRecord[] = [
  {
    id: '1',
    matricula: '#WMS-0842',
    nome: 'Marco Aurélio Silva',
    cargo: 'Operador de Empilhadeira',
    departamento: 'logistica',
    turno: 'manha',
    produtividade: 96,
    status: 'ativo',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHXnCoFQ09-lzK8rgXh5rCmK0NYYr3l1EORIfHr7rIu9oKBfnNnzExU7-j1fJU-A_ITRkIp8n9GyJq47S6BXuHq-RA1_jnuuwytn8pFzxDpHr-ZLObcaBWmQszfXoEtPStbMOcS9t-vUlFvclN76wP0jSV3wmEuxGgwuK4_EB1tbdgD7xpQk8asyFQO_Nlxwn6m1Z3IhByXqR5HmNPyAewGsC5h4Y5Lkn8SotrVDIknslShwcr6M2ODle5r0br49K-EkWdTOqctfI',
  },
  {
    id: '2',
    matricula: '#WMS-1290',
    nome: 'Beatriz Santos',
    cargo: 'Auxiliar de Expedição',
    departamento: 'triagem',
    turno: 'tarde',
    produtividade: 82,
    status: 'ativo',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDDlbtbtGr2t06zHMj-9kvezLPtWFFxolvSEzcJc4WAfMwXVU9WiIqrHjcMBsu3qqRnibHroKfLqarSziBMq2lVqgTkfU-dEqM4yznzlxdgx8XicG8ywyZo0sW_DMWHfv44hQ1Bv2nfG96sQzyvGRDVCe9BV1ewWDeVwTBZsXzwDQMkx1a8ozyVnd-JZAvIN_yAN0sUKXKYj6RoAh6ephioznR2eEhtjSybckr4fBj4GvUh1WEvS5_k1-WIC1TQusXr8LaageixVys',
  },
  {
    id: '3',
    matricula: '#WMS-0412',
    nome: 'Roberto Mendes',
    cargo: 'Técnico de Manutenção',
    departamento: 'manutencao',
    turno: 'noite',
    produtividade: 45,
    status: 'inativo',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2IpgZJKDYQ9N7iXBrqnIIWdwlL0QYKiHrN-X2cHhsoIM_rFVxjEb6vHdzPIKo444xfIlDjcpUPYMq5rSj3ae1f46UyxnirNR3h-idqOZd_worQwKe_36EpLmr2IlYU6T9MlQE4XkEW5ySX5dbVDdAJ-Y05FgVox6YB7NfOJcvG5DUTHrGM2CASwN4RExiEWHruRyrKsYNgsMS47di2BdQoRJsTSVB-jEC1j1L5Y1uQysTvTEVYafvmlMzPZPki8-qk9uOI-_AjQg',
  },
  {
    id: '4',
    matricula: '#WMS-2231',
    nome: 'Carla Oliveira',
    cargo: 'Conferente de Carga',
    departamento: 'recebimento',
    turno: 'manha',
    produtividade: 88,
    status: 'ativo',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANGkUKIBksvbOqAIflCpSNrmuwNHGjfbqhHzMGxOOpyzZEcwUDweLtKjQBWXW3Z9-ieaEzFJz50CBfwwX_ZFEQw4DJRsNrzz56KG0-bsG0QW0Rx1vFCBUUvC6OpALDb0I65_7TAemqiPXrATiF6HXgKPsqbsi804_R2JN2O_jR6YPDiyzx90iT6WfwvLPiS23kFE_wXK-Hy9I1n-LjEX3J7lGC3ZPrsDFj7Zwuc6Id6G0bGRTOv8uy-qE0SVCzWbZinkH4wdhlEa0',
  },
  {
    id: '5',
    matricula: '#WMS-3105',
    nome: 'Fernando Costa',
    cargo: 'Supervisor de Triagem',
    departamento: 'qualidade',
    turno: 'tarde',
    produtividade: 74,
    status: 'ativo',
  },
  {
    id: '6',
    matricula: '#WMS-5520',
    nome: 'Juliana Pereira',
    cargo: 'Auxiliar de Expedição',
    departamento: 'expedicao',
    turno: 'noite',
    produtividade: 91,
    status: 'ativo',
  },
];

export const STATUS_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Status' },
  { value: 'ativo' as const, label: 'Ativo' },
  { value: 'inativo' as const, label: 'Inativo' },
];

export const DEPARTAMENTO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Departamento' },
  { value: 'logistica' as const, label: 'Logística' },
  { value: 'montagem' as const, label: 'Montagem' },
  { value: 'qualidade' as const, label: 'Qualidade' },
  { value: 'triagem' as const, label: 'Triagem' },
  { value: 'manutencao' as const, label: 'Manutenção' },
  { value: 'recebimento' as const, label: 'Recebimento' },
];

export const TURNO_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Turno' },
  { value: 'manha' as const, label: 'Manhã' },
  { value: 'tarde' as const, label: 'Tarde' },
  { value: 'noite' as const, label: 'Noite' },
];
