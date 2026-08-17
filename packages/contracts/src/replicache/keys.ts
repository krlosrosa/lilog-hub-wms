/** Replicache keyspace for recebimento pilot. */



export const REPLICACHE_SCHEMA_VERSION = 'recebimento-rc-v7';



export function demandKey(preRecebimentoId: string): string {

  return `demand/${preRecebimentoId}`;

}



export function demandPrefix(): string {

  return 'demand/';

}



export function resolveItemConferidoRecordId(

  pesagemId: string | null | undefined,

  recebimentoItemId: string,

): string {

  return pesagemId ?? recebimentoItemId;

}



export function itemConferidoKey(

  preRecebimentoId: string,

  produtoId: string,

  itemId: string,

): string {

  return `itemConferido/${preRecebimentoId}/${produtoId}/${itemId}`;

}



export function itemConferidoPrefix(preRecebimentoId: string): string {

  return `itemConferido/${preRecebimentoId}/`;

}



export function expectedItemKey(

  preRecebimentoId: string,

  produtoId: string,

): string {

  return `expectedItem/${preRecebimentoId}/${produtoId}`;

}



export function expectedItemPrefix(preRecebimentoId: string): string {

  return `expectedItem/${preRecebimentoId}/`;

}



export function parametrosConferenciaKey(unidadeId: string): string {

  return `parametrosConferencia/${unidadeId}`;

}



export function checklistKey(preRecebimentoId: string): string {

  return `checklist/${preRecebimentoId}`;

}



export function checklistPrefix(): string {

  return 'checklist/';

}



export function temperaturaBauKey(

  preRecebimentoId: string,

  etapa: string,

): string {

  return `temperaturaBau/${preRecebimentoId}/${etapa}`;

}



export function temperaturaBauPrefix(preRecebimentoId: string): string {

  return `temperaturaBau/${preRecebimentoId}/`;

}



export function avariaKey(preRecebimentoId: string, avariaId: string): string {

  return `avaria/${preRecebimentoId}/${avariaId}`;

}



export function avariaPrefix(preRecebimentoId: string): string {

  return `avaria/${preRecebimentoId}/`;

}



export function parseClientGroupId(clientGroupId: string): {

  userId: number;

  unidadeId: string;

} | null {

  const match = /^u:(\d+):unit:(.+)$/.exec(clientGroupId.trim());

  if (!match) {

    return null;

  }



  const userId = Number(match[1]);

  const unidadeId = match[2]?.trim() ?? '';

  if (!Number.isFinite(userId) || userId <= 0 || !unidadeId) {

    return null;

  }



  return { userId, unidadeId };

}



export function buildClientGroupId(userId: number, unidadeId: string): string {

  return `u:${userId}:unit:${unidadeId}`;

}


