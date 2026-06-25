import type { DocModuloContent } from '../types';

export const unidadesContent: DocModuloContent = {
  slug: 'unidades',
  title: 'Unidades',
  description: 'Cadastre filiais, centros de custo e informações operacionais de cada unidade.',
  icon: 'Building2',
  href: '/documentacao/unidades',
  sections: [
    { id: 'visao-geral', label: 'Visão geral' },
    { id: 'passo-a-passo', label: 'Passo a passo' },
    { id: 'dicas', label: 'Dicas' },
    { id: 'perguntas-frequentes', label: 'Perguntas frequentes' },
  ],
  overview:
    'O módulo de Unidades é a base do sistema. Antes de cadastrar produtos, receber mercadorias ou iniciar inventários, você precisa ter ao menos uma filial registrada com seus centros de custo e dados de localização.',
  steps: [
    {
      title: 'Acesse a lista de unidades',
      description:
        'No menu lateral, clique em Operacional > Unidades. Você verá a lista de filiais cadastradas com filtros, estatísticas e paginação.',
      details: [
        'Use a barra de busca para localizar uma unidade pelo nome ou código.',
        'Os cards no topo mostram totais e status das unidades.',
      ],
    },
    {
      title: 'Cadastre uma nova unidade',
      description:
        'Clique em "Nova unidade" ou acesse /unidades/nova. Preencha as informações gerais: nome, código, endereço e dados de contato.',
      details: [
        'Campos obrigatórios devem ser preenchidos antes de salvar.',
        'O sistema gera um identificador interno automaticamente.',
      ],
    },
    {
      title: 'Adicione centros de custo',
      description:
        'Na tela de cadastro ou detalhe, use a seção Centros de Custo para registrar áreas operacionais (ex.: depósito, loja, picking).',
      details: [
        'Clique em "Adicionar centro" para abrir o modal de cadastro.',
        'Cada centro pode ser editado ou removido enquanto a unidade estiver em edição.',
      ],
    },
    {
      title: 'Registre fotos e localização',
      description:
        'Complete o cadastro com fotos da unidade e confirme a geolocalização no mapa para facilitar operações de campo.',
      details: [
        'As fotos ajudam equipes externas a identificar a unidade.',
        'Valide o endereço no mapa antes de finalizar.',
      ],
    },
    {
      title: 'Salve e consulte o detalhe',
      description:
        'Clique em "Salvar unidade". Depois, abra o detalhe da filial para revisar métricas, centros e histórico.',
    },
  ],
  tips: [
    {
      type: 'info',
      title: 'Cadastre unidades antes dos produtos',
      description:
        'Produtos e recebimentos são vinculados a unidades. Manter o cadastro de filiais atualizado evita erros nas etapas seguintes.',
    },
    {
      type: 'warning',
      title: 'Revise centros de custo com atenção',
      description:
        'Centros mal definidos impactam inventários e relatórios por setor. Confirme nomes e códigos com o time operacional antes de salvar.',
    },
  ],
  faqs: [
    {
      question: 'Posso editar uma unidade depois de salvar?',
      answer:
        'Sim. Acesse a unidade na lista e abra o detalhe. As seções de informações gerais, centros e fotos podem ser atualizadas conforme sua permissão.',
    },
    {
      question: 'Quantos centros de custo posso cadastrar?',
      answer:
        'Não há limite fixo na interface. Cadastre quantos centros forem necessários para refletir a estrutura operacional da filial.',
    },
    {
      question: 'O que acontece se eu não preencher a geolocalização?',
      answer:
        'A unidade pode ser salva, mas mapas e operações que dependem de localização ficarão incompletos. Recomenda-se validar o endereço no mapa.',
    },
  ],
};
