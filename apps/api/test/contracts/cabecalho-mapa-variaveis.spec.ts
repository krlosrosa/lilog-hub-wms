import { describe, expect, it } from 'vitest';

import {
  aplicarVariaveisCabecalhoMapa,
  montarVariaveisCabecalhoMapa,
  QR_CODE_VARIAVEL,
  substituirVariaveisCabecalho,
  type CabecalhoGrupoMapa,
} from '@lilog/contracts';

const cabecalhoBase: CabecalhoGrupoMapa = {
  transporte: 'Rota A',
  placa: 'ABC-1234',
  transportadora: 'TransLog',
  codPrimeiroCliente: 'C001',
  primeiroCliente: 'Cliente A',
  codTodosClientes: 'C001 · C002',
  todosClientes: 'Cliente A · Cliente B',
  pesoTotal: 132,
  totalCaixas: 2,
  totalUnidades: 0,
  totalPaletes: 1,
  nomeGrupo: 'Rota A',
  quantidadeLinhas: 2,
  categoria: 'seco',
  empresa: 'Empresa X',
  microUuid: 'Rota-A-V1StGXR8_Z5jdHi6B-myT',
};

describe('montarVariaveisCabecalhoMapa', () => {
  it('mapeia rota a partir de transporte', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis['{{rota}}']).toBe('Rota A');
    expect(variaveis['{{id_mapa}}']).toBe('Rota-A-V1StGXR8_Z5jdHi6B-myT');
    expect(variaveis['{{grupo}}']).toBe('Rota A');
    expect(variaveis['{{categoria}}']).toBe('seco');
  });

  it('converte placa e transportadora null para string vazia', () => {
    const variaveis = montarVariaveisCabecalhoMapa({
      ...cabecalhoBase,
      placa: null,
      transportadora: null,
    });

    expect(variaveis['{{placa}}']).toBe('');
    expect(variaveis['{{transportadora}}']).toBe('');
  });

  it('formata peso em pt-BR com kg', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis['{{peso}}']).toBe('132,00 kg');
  });

  it('usa empresa como alias de empresas_transporte', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis['{{empresa}}']).toBe('Empresa X');
    expect(variaveis['{{empresas_transporte}}']).toBe('Empresa X');
  });

  it('formata sequencia com pad de 3 digitos', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase, { sequencia: 7 });

    expect(variaveis['{{sequencia}}']).toBe('007');
  });

  it('retorna sequencia vazia sem contexto', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis['{{sequencia}}']).toBe('');
  });

  it('info adicionais vazios por padrao', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis['{{info_adicionais_i}}']).toBe('');
    expect(variaveis['{{info_adicionais_ii}}']).toBe('');
  });

  it('mapeia qr_code para microUuid', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);

    expect(variaveis[QR_CODE_VARIAVEL]).toBe('Rota-A-V1StGXR8_Z5jdHi6B-myT');
  });
});

describe('substituirVariaveisCabecalho', () => {
  it('substitui placeholders no template', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase, { sequencia: 1 });
    const html = substituirVariaveisCabecalho(
      '<p>{{rota}} · {{placa}} · Seq. {{sequencia}}</p>',
      variaveis,
    );

    expect(html).toBe('<p>Rota A · ABC-1234 · Seq. 001</p>');
  });

  it('preserva qr_code por padrao', () => {
    const variaveis = montarVariaveisCabecalhoMapa(cabecalhoBase);
    const html = substituirVariaveisCabecalho('<span>{{qr_code}}</span>', variaveis);

    expect(html).toBe('<span>{{qr_code}}</span>');
  });
});

describe('aplicarVariaveisCabecalhoMapa', () => {
  it('aplica cabecalho completo no template', () => {
    const html = aplicarVariaveisCabecalhoMapa(
      '{{primeiro_cliente}} ({{codigo_primeiro_cliente}}) — {{peso}}',
      cabecalhoBase,
    );

    expect(html).toBe('Cliente A (C001) — 132,00 kg');
  });
});
