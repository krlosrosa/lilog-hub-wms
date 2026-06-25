import type { DocModuloContent } from '../types';

export const recebimentoContent: DocModuloContent = {
  slug: 'recebimento',
  title: 'Recebimento',
  description: 'Registre entradas de mercadoria, conferência, inspeção e evidências.',
  icon: 'Truck',
  href: '/documentacao/recebimento',
  sections: [
    { id: 'visao-geral', label: 'Visão geral' },
    { id: 'passo-a-passo', label: 'Passo a passo' },
    { id: 'dicas', label: 'Dicas' },
    { id: 'perguntas-frequentes', label: 'Perguntas frequentes' },
  ],
  overview:
    'O módulo de Recebimento controla a entrada de mercadorias no centro de distribuição. Você registra veículos, importa listas de itens, realiza conferência, inspeção de qualidade e anexa fotos como evidência.',
  steps: [
    {
      title: 'Acesse a visão de recebimento',
      description:
        'No menu lateral, clique em Operacional > Recebimento. A tela mostra recebimentos em andamento, estatísticas e controle de docas.',
      details: [
        'O painel de docas indica quais estão livres ou ocupadas.',
        'Use filtros e busca para localizar um recebimento específico.',
      ],
    },
    {
      title: 'Crie um novo recebimento',
      description:
        'Clique em "Novo recebimento" ou acesse /recebimento/novo. Informe dados do veículo: placa, transportadora, motorista e horário de chegada.',
    },
    {
      title: 'Importe a lista de itens',
      description:
        'Na seção Importação, faça upload do arquivo com os produtos esperados (planilha ou integração simulada).',
      details: [
        'Confira o preview dos itens após a importação.',
        'Itens não encontrados no catálogo devem ser cadastrados em Produtos antes.',
      ],
    },
    {
      title: 'Realize a conferência',
      description:
        'No detalhe do recebimento, use a tabela de Conferência para comparar quantidade esperada vs. contada por item.',
      details: [
        'Marque itens conferidos conforme a contagem física.',
        'Divergências ficam destacadas para revisão.',
      ],
    },
    {
      title: 'Execute a inspeção de qualidade',
      description:
        'Preencha a seção Inspeção com status, observações e non-conformidades encontradas durante a descarga.',
    },
    {
      title: 'Registre evidências fotográficas',
      description:
        'Anexe fotos do veículo, da carga e de avarias na seção Fotos/Evidências. Isso documenta o estado da mercadoria na entrada.',
    },
    {
      title: 'Finalize o recebimento',
      description:
        'Após conferência e inspeção, conclua o processo. O status do recebimento será atualizado na lista principal.',
    },
  ],
  tips: [
    {
      type: 'info',
      title: 'Monitore as docas em tempo real',
      description:
        'Antes de registrar a chegada, verifique no painel de docas qual está disponível para evitar fila de veículos.',
    },
    {
      type: 'warning',
      title: 'Não finalize sem conferir divergências',
      description:
        'Itens com diferença entre esperado e contado devem ser tratados antes do encerramento. Registre observações e fotos quando necessário.',
    },
  ],
  faqs: [
    {
      question: 'O que faço se um produto da nota não existe no catálogo?',
      answer:
        'Cadastre o produto em Operacional > Produtos e retorne ao recebimento para vincular o item corretamente na conferência.',
    },
    {
      question: 'Posso pausar um recebimento?',
      answer:
        'Sim. Recebimentos em andamento permanecem na lista com status atualizado. Retome pelo detalhe quando a descarga ou conferência continuar.',
    },
    {
      question: 'As fotos são obrigatórias?',
      answer:
        'Depende da política interna. Recomenda-se registrar evidências sempre que houver avaria, divergência ou exigência do fornecedor.',
    },
  ],
};
