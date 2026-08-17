import {

  checklistKey,

  demandPrefix,

  expectedItemPrefix,

  itemConferidoPrefix,

  temperaturaBauPrefix,

  avariaPrefix,

  type AvariaView,

  type ChecklistView,

  type DemandView,

  type ExpectedItemView,

  type ItemConferidoView,

  type ParametrosConferenciaView,

  type TemperaturaBauView,

} from '@lilog/contracts';

import type { ReadTransaction } from 'replicache';



export async function listDemandas(tx: ReadTransaction): Promise<DemandView[]> {

  const entries = await tx.scan({ prefix: demandPrefix() }).entries().toArray();

  return entries

    .map(([, value]) => value as DemandView)

    .sort((a, b) => a.horarioPrevisto.localeCompare(b.horarioPrevisto));

}



export async function getDemanda(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<DemandView | null> {

  const value = await tx.get(`${demandPrefix()}${preRecebimentoId}`);

  return (value as DemandView | undefined) ?? null;

}



export async function listItensConferidos(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<ItemConferidoView[]> {

  const entries = await tx

    .scan({ prefix: itemConferidoPrefix(preRecebimentoId) })

    .entries()

    .toArray();



  return entries

    .map(([, value]) => value as ItemConferidoView)

    .sort((a, b) => a.sku.localeCompare(b.sku));

}



export async function listExpectedItems(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<ExpectedItemView[]> {

  const entries = await tx

    .scan({ prefix: expectedItemPrefix(preRecebimentoId) })

    .entries()

    .toArray();



  return entries

    .map(([, value]) => value as ExpectedItemView)

    .sort((a, b) => a.sku.localeCompare(b.sku));

}



export async function getParametrosConferencia(

  tx: ReadTransaction,

  unidadeId: string,

): Promise<ParametrosConferenciaView | null> {

  const value = await tx.get(`parametrosConferencia/${unidadeId}`);

  return (value as ParametrosConferenciaView | undefined) ?? null;

}



export async function getChecklist(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<ChecklistView | null> {

  const value = await tx.get(checklistKey(preRecebimentoId));

  return (value as ChecklistView | undefined) ?? null;

}



export async function listTemperaturasBau(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<TemperaturaBauView[]> {

  const entries = await tx

    .scan({ prefix: temperaturaBauPrefix(preRecebimentoId) })

    .entries()

    .toArray();



  return entries

    .map(([, value]) => value as TemperaturaBauView)

    .sort((a, b) => a.etapa.localeCompare(b.etapa));

}



export async function listAvarias(

  tx: ReadTransaction,

  preRecebimentoId: string,

): Promise<AvariaView[]> {

  const entries = await tx

    .scan({ prefix: avariaPrefix(preRecebimentoId) })

    .entries()

    .toArray();



  return entries

    .map(([, value]) => value as AvariaView)

    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

}


