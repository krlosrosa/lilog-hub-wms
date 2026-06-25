import type { DocModuloContent } from '../types';

export const inventarioContent: DocModuloContent = {
  slug: 'inventario',
  title: 'Inventário',
  description: 'Planeje contagens, gerencie setores, equipe, demandas e divergências.',
  icon: 'ClipboardList',
  href: '/documentacao/inventario',
  sections: [
    { id: 'visao-geral', label: 'Visão geral' },
    { id: 'passo-a-passo', label: 'Passo a passo' },
    { id: 'dicas', label: 'Dicas' },
    { id: 'perguntas-frequentes', label: 'Perguntas frequentes' },
  ],
  overview:
    'O módulo de Inventário permite planejar e executar levantamentos de estoque. O fluxo inclui configuração do inventário, definição de demandas por setor, acompanhamento em tempo real e tratamento de divergências.',
  steps: [
    {
      title: 'Consulte a visão geral',
      description:
        'Acesse Operacional > Inventário. A tela exibe KPIs, gráfico de tendência e tabela com inventários (ID, data, responsável, tipo, acurácia e status).',
      details: [
        'Use filtros e busca para localizar inventários anteriores.',
        'Exporte dados quando precisar de relatório externo.',
      ],
    },
    {
      title: 'Crie um novo inventário',
      description:
        'Clique em "Novo inventário" ou acesse /inventario/novo. Defina tipo (cíclico, geral etc.), responsável, gestor e cronograma.',
      details: [
        'Escolha o tipo conforme a operação (amostragem vs. contagem total).',
        'Informe datas de início e término previstas.',
      ],
    },
    {
      title: 'Configure as demandas de contagem',
      description:
        'Após salvar a configuração básica, você será direcionado para Gestão de demandas (/inventario/novo/demandas).',
      details: [
        'Clique em "Adicionar demanda" para definir setor, responsável e método.',
        'Cada demanda representa uma área ou tarefa de contagem.',
        'Revise o resumo de setores e equipe antes de avançar.',
      ],
    },
    {
      title: 'Inicie o inventário',
      description:
        'Na etapa final do wizard, confirme as demandas e clique em salvar e iniciar. O inventário passará ao status em execução.',
    },
    {
      title: 'Acompanhe o detalhe em tempo real',
      description:
        'Abra o inventário pelo ID na lista. A tela de detalhe mostra progresso por setor, equipe, métricas e divergências.',
      details: [
        'Use Pausar quando precisar interromper a operação.',
        'Finalizar encerra o inventário após revisão das contagens.',
      ],
    },
    {
      title: 'Trate divergências',
      description:
        'Na seção de divergências, analise itens com diferença entre estoque sistêmico e contado. Exporte CSV ou revise todas conforme necessário.',
    },
  ],
  tips: [
    {
      type: 'info',
      title: 'Siga a ordem do wizard',
      description:
        'Complete Configuração básica → Gestão de demandas → Revisão e início. Pular etapas pode deixar setores sem responsável definido.',
    },
    {
      type: 'warning',
      title: 'Bloqueie movimentações durante contagem',
      description:
        'Evite recebimentos ou transferências no setor enquanto a contagem estiver ativa. Isso reduz divergências e retrabalho.',
    },
  ],
  faqs: [
    {
      question: 'Posso adicionar demandas depois de iniciar?',
      answer:
        'Depende do status do inventário. Em geral, demandas são definidas antes do início. Consulte o responsável pelo processo para ajustes em inventários em execução.',
    },
    {
      question: 'O que significa acurácia (%)?',
      answer:
        'É o percentual de acerto entre o estoque registrado no sistema e a contagem física. Quanto maior, melhor a qualidade do inventário.',
    },
    {
      question: 'Como exportar divergências?',
      answer:
        'No detalhe do inventário, use a ação de exportar CSV na seção de divergências para analisar os itens em planilha.',
    },
  ],
};
