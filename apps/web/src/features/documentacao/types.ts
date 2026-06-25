export type DocSectionId = 'visao-geral' | 'passo-a-passo' | 'dicas' | 'perguntas-frequentes';

export type DocSection = {
  id: DocSectionId;
  label: string;
};

export type DocStep = {
  title: string;
  description: string;
  details?: string[];
};

export type DocTip = {
  type: 'info' | 'warning';
  title: string;
  description: string;
};

export type DocFaq = {
  question: string;
  answer: string;
};

export type DocModuloContent = {
  slug: string;
  title: string;
  description: string;
  icon: 'Building2' | 'Package' | 'Truck' | 'ClipboardList';
  href: string;
  sections: DocSection[];
  overview: string;
  steps: DocStep[];
  tips: DocTip[];
  faqs: DocFaq[];
};

export type DocModuloSlug = 'unidades' | 'produtos' | 'recebimento' | 'inventario';
