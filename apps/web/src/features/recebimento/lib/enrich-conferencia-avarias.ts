import type {

  DocumentoApi,

  RecebimentoAvariaApi,

} from '@/features/recebimento/types/recebimento.api';

import type {

  ConferenciaAvaria,

  ConferenciaItem,

  FotoEvidencia,

} from '@/features/recebimento/types/recebimento-detalhe.schema';



function mapAvariaApi(

  item: RecebimentoAvariaApi,

  fotos: FotoEvidencia[],

): ConferenciaAvaria {

  return {

    id: item.id,

    tipo: item.tipo,

    natureza: item.natureza,

    causa: item.causa,

    quantidadeCaixas: item.quantidadeCaixas,

    quantidadeUnidades: item.quantidadeUnidades,

    photoCount: item.photoCount,

    replicado: item.replicado,

    fotos,

  };

}



function isMesmoLoteAvaria(

  anterior: RecebimentoAvariaApi,

  atual: RecebimentoAvariaApi,

): boolean {

  return (

    anterior.replicado &&

    atual.replicado &&

    anterior.createdAt === atual.createdAt &&

    anterior.photoCount === atual.photoCount &&

    anterior.tipo === atual.tipo &&

    anterior.natureza === atual.natureza &&

    anterior.causa === atual.causa

  );

}



type LoteAvaria = {

  avariaIds: string[];

  photoCount: number;

};



function agruparAvariasEmLotes(

  avarias: RecebimentoAvariaApi[],

): LoteAvaria[] {

  const ordenadas = [...avarias].sort(

    (a, b) =>

      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),

  );



  const lotes: LoteAvaria[] = [];



  for (const avaria of ordenadas) {

    const ultimo = lotes.at(-1);

    const ultimaAvaria = ordenadas.find(

      (item) => item.id === ultimo?.avariaIds.at(-1),

    );



    if (ultimo && ultimaAvaria && isMesmoLoteAvaria(ultimaAvaria, avaria)) {

      ultimo.avariaIds.push(avaria.id);

      continue;

    }



    lotes.push({

      avariaIds: [avaria.id],

      photoCount: avaria.photoCount,

    });

  }



  return lotes;

}



/** Distribui documentos de avaria entre registros conforme photoCount e ordem de criação. */

export function alocarFotosPorAvaria(

  avarias: RecebimentoAvariaApi[],

  documentos: DocumentoApi[],

  fotosPorDocumento: Map<string, FotoEvidencia>,

): Map<string, FotoEvidencia[]> {

  const fotosPorAvaria = new Map<string, FotoEvidencia[]>();

  const documentosOrdenados = [...documentos].sort(

    (a, b) =>

      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),

  );



  let indiceDocumento = 0;



  for (const lote of agruparAvariasEmLotes(avarias)) {

    const fotosDoLote: FotoEvidencia[] = [];



    for (let i = 0; i < lote.photoCount; i += 1) {

      const documento = documentosOrdenados[indiceDocumento];

      if (!documento) {

        break;

      }



      const foto = fotosPorDocumento.get(documento.id);

      if (foto) {

        fotosDoLote.push(foto);

      }



      indiceDocumento += 1;

    }



    for (const avariaId of lote.avariaIds) {

      fotosPorAvaria.set(avariaId, fotosDoLote);

    }

  }



  return fotosPorAvaria;

}



export function enrichConferenciaComAvarias(

  itens: ConferenciaItem[],

  avarias: RecebimentoAvariaApi[],

  fotosPorAvaria: Map<string, FotoEvidencia[]>,

): ConferenciaItem[] {

  const avariasPorProduto = new Map<string, ConferenciaAvaria[]>();



  for (const avaria of avarias) {

    if (!avaria.produtoId) {

      continue;

    }



    const fotos = fotosPorAvaria.get(avaria.id) ?? [];

    const atual = avariasPorProduto.get(avaria.produtoId) ?? [];

    atual.push(mapAvariaApi(avaria, fotos));

    avariasPorProduto.set(avaria.produtoId, atual);

  }



  return itens.map((item) => ({

    ...item,

    avarias: avariasPorProduto.get(item.produtoId) ?? [],

  }));

}



export function itemTemFotosAvaria(item: ConferenciaItem): boolean {

  return item.avarias.some((avaria) => avaria.fotos.length > 0);

}


