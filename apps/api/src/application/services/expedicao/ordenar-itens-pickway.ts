export type ItemOrdenavelPickway = {

  sku: string;

  endereco?: string | null;

  slottingOrdem?: number | null;

  zona?: string | null;

  rua?: string | null;

  posicao?: string | null;

  nivel?: string | null;

  prioridadePicking?: number | null;

};



function temEndereco(item: ItemOrdenavelPickway): boolean {

  return Boolean(item.endereco?.trim());

}



function compararNumerico(a: string | null | undefined, b: string | null | undefined): number {

  const numA = Number(a ?? '');

  const numB = Number(b ?? '');



  if (Number.isFinite(numA) && Number.isFinite(numB)) {

    return numA - numB;

  }



  return String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR');

}



function compararSlottingOrdem(

  a: number | null | undefined,

  b: number | null | undefined,

): number {

  if (a != null && b != null && a !== b) {

    return a - b;

  }



  if (a != null && b == null) {

    return -1;

  }



  if (a == null && b != null) {

    return 1;

  }



  return 0;

}



function compararPickway(

  a: ItemOrdenavelPickway,

  b: ItemOrdenavelPickway,

): number {

  const aTemEndereco = temEndereco(a);

  const bTemEndereco = temEndereco(b);



  if (aTemEndereco !== bTemEndereco) {

    return aTemEndereco ? -1 : 1;

  }



  if (!aTemEndereco && !bTemEndereco) {

    return a.sku.localeCompare(b.sku, 'pt-BR');

  }



  const ordemSlotting = compararSlottingOrdem(a.slottingOrdem, b.slottingOrdem);

  if (ordemSlotting !== 0) {

    return ordemSlotting;

  }



  const prioridadeA = a.prioridadePicking;

  const prioridadeB = b.prioridadePicking;



  if (prioridadeA != null && prioridadeB != null && prioridadeA !== prioridadeB) {

    return prioridadeA - prioridadeB;

  }



  if (prioridadeA != null && prioridadeB == null) {

    return -1;

  }



  if (prioridadeA == null && prioridadeB != null) {

    return 1;

  }



  const zona = String(a.zona ?? '').localeCompare(String(b.zona ?? ''), 'pt-BR');

  if (zona !== 0) {

    return zona;

  }



  const rua = compararNumerico(a.rua, b.rua);

  if (rua !== 0) {

    return rua;

  }



  const posicao = compararNumerico(a.posicao, b.posicao);

  if (posicao !== 0) {

    return posicao;

  }



  const nivel = compararNumerico(a.nivel, b.nivel);

  if (nivel !== 0) {

    return nivel;

  }



  const endereco = String(a.endereco ?? '').localeCompare(

    String(b.endereco ?? ''),

    'pt-BR',

  );

  if (endereco !== 0) {

    return endereco;

  }



  return a.sku.localeCompare(b.sku, 'pt-BR');

}



export function ordenarItensPickway<T extends ItemOrdenavelPickway>(

  itens: T[],

): T[] {

  return [...itens].sort(compararPickway);

}


