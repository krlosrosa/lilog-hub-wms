import type { DocModuloContent } from '../types';

export const produtosContent: DocModuloContent = {
  slug: 'produtos',
  title: 'Produtos',
  description: 'Cadastre e organize o catálogo com medidas, logística e classificação.',
  icon: 'Package',
  href: '/documentacao/produtos',
  sections: [
    { id: 'visao-geral', label: 'Visão geral' },
    { id: 'passo-a-passo', label: 'Passo a passo' },
    { id: 'dicas', label: 'Dicas' },
    { id: 'perguntas-frequentes', label: 'Perguntas frequentes' },
  ],
  overview:
    'O módulo de Produtos centraliza o catálogo de itens que circulam no estoque. Um cadastro completo inclui informações básicas, medidas físicas, dados logísticos e classificação — essenciais para recebimento e inventário.',
  steps: [
    {
      title: 'Abra o catálogo de produtos',
      description:
        'No menu lateral, vá em Operacional > Produtos. A tela exibe estatísticas, filtros e a lista paginada de itens.',
      details: [
        'Use a busca para encontrar produtos por nome, SKU ou categoria.',
        'Os cards superiores resumem volume e atividade recente.',
      ],
    },
    {
      title: 'Inicie um novo cadastro',
      description:
        'Clique em "Novo produto" ou acesse /produtos/novo. O formulário está dividido em seções para facilitar o preenchimento.',
    },
    {
      title: 'Preencha informações básicas',
      description:
        'Informe nome, SKU, descrição, unidade de medida e demais campos da seção Informações Básicas.',
      details: [
        'O SKU deve ser único para evitar duplicidade no catálogo.',
        'Revise ortografia e códigos antes de avançar.',
      ],
    },
    {
      title: 'Configure medidas e logística',
      description:
        'Na seção Medidas, informe peso, dimensões e volumes. Em Logística, defina parâmetros de armazenagem e movimentação.',
      details: [
        'Medidas corretas evitam erros de cubagem no recebimento.',
        'Parâmetros logísticos impactam alocação em docas e endereços.',
      ],
    },
    {
      title: 'Classifique o produto',
      description:
        'Use a seção Classificação para categorizar o item (família, grupo, tags). Isso facilita filtros e relatórios.',
    },
    {
      title: 'Salve o produto',
      description:
        'Clique em "Salvar produto". O item passará a aparecer na lista e poderá ser usado em recebimentos e inventários.',
    },
  ],
  tips: [
    {
      type: 'info',
      title: 'Padronize SKUs e descrições',
      description:
        'Adote um padrão de nomenclatura entre unidades. Isso reduz divergências na conferência e na contagem de inventário.',
    },
    {
      type: 'warning',
      title: 'Medidas incorretas geram retrabalho',
      description:
        'Peso e dimensões errados afetam cálculos logísticos e podem causar bloqueios no recebimento. Confira a embalagem real do produto.',
    },
  ],
  faqs: [
    {
      question: 'Posso cadastrar produto sem ter unidade?',
      answer:
        'Recomenda-se ter unidades cadastradas primeiro, pois operações de estoque são vinculadas a filiais. O produto em si faz parte do catálogo global.',
    },
    {
      question: 'Como edito um produto existente?',
      answer:
        'Na lista de produtos, localize o item e use a ação de edição disponível na linha. As mesmas seções do cadastro estarão disponíveis.',
    },
    {
      question: 'Quais campos são obrigatórios?',
      answer:
        'Informações básicas como nome e SKU são essenciais. Medidas e classificação podem ser exigidas conforme regras internas — preencha todas as seções antes de salvar.',
    },
  ],
};
