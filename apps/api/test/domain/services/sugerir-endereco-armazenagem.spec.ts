import { describe, expect, it } from 'vitest';

import {
  selecionarRegraEnderecamento,
  sugerirEnderecoArmazenagem,
} from '../../../src/domain/services/sugerir-endereco-armazenagem.js';

describe('sugerir-endereco-armazenagem', () => {
  const produto = {
    produtoId: 'P001',
    grupo: 'Poupa Garrafão',
    categoria: 'Bebidas',
  };

  const regras = [
    {
      id: 'regra-categoria',
      criterioTipo: 'categoria' as const,
      criterioValor: 'Bebidas',
      prioridade: 20,
      destinos: [
        {
          id: 'dest-cat',
          regraId: 'regra-categoria',
          prioridade: 1,
          tipo: 'zona' as const,
          zona: 'CORREDOR C',
          enderecoId: null,
          ativo: true,
        },
      ],
    },
    {
      id: 'regra-grupo',
      criterioTipo: 'grupo' as const,
      criterioValor: 'Poupa Garrafão',
      prioridade: 10,
      destinos: [
        {
          id: 'dest-grupo-1',
          regraId: 'regra-grupo',
          prioridade: 1,
          tipo: 'zona' as const,
          zona: 'CORREDOR A',
          enderecoId: null,
          ativo: true,
        },
        {
          id: 'dest-grupo-2',
          regraId: 'regra-grupo',
          prioridade: 2,
          tipo: 'endereco' as const,
          zona: null,
          enderecoId: 'endereco-fixo',
          ativo: true,
        },
      ],
    },
    {
      id: 'regra-produto',
      criterioTipo: 'produto' as const,
      criterioValor: 'P001',
      prioridade: 30,
      destinos: [
        {
          id: 'dest-produto',
          regraId: 'regra-produto',
          prioridade: 1,
          tipo: 'endereco' as const,
          zona: null,
          enderecoId: 'endereco-produto',
          ativo: true,
        },
      ],
    },
  ];

  it('prioriza critério produto sobre grupo e categoria', () => {
    const selected = selecionarRegraEnderecamento(regras, produto);
    expect(selected?.id).toBe('regra-produto');
  });

  it('usa grupo quando não há regra de produto', () => {
    const selected = selecionarRegraEnderecamento(
      regras.filter((regra) => regra.criterioTipo !== 'produto'),
      produto,
    );
    expect(selected?.id).toBe('regra-grupo');
  });

  it('tenta destinos em ordem de prioridade', async () => {
    const calls: string[] = [];

    const enderecoId = await sugerirEnderecoArmazenagem(
      produto,
      [regras[1]],
      async ({ tipo, zona, enderecoId: id }) => {
        calls.push(`${tipo}:${zona ?? id}`);

        if (tipo === 'zona') {
          return null;
        }

        return id ?? null;
      },
    );

    expect(calls).toEqual(['zona:CORREDOR A', 'endereco:endereco-fixo']);
    expect(enderecoId).toBe('endereco-fixo');
  });

  it('retorna null quando nenhum destino está disponível', async () => {
    const enderecoId = await sugerirEnderecoArmazenagem(
      produto,
      [regras[1]],
      async () => null,
    );

    expect(enderecoId).toBeNull();
  });
});
