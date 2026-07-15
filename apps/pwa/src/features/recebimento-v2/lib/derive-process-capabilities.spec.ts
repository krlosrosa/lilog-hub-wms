import { describe, expect, it } from 'vitest';

import {
  APOIO_CAPABILITIES,
  deriveCapabilitiesFromProcess,
  deriveCapabilitiesFromProcessHeader,
  RESPONSAVEL_CAPABILITIES,
  RESTRICTIVE_CAPABILITIES,
} from './derive-process-capabilities';

describe('derive-process-capabilities', () => {
  it('prioriza capabilities do pacote baixado', () => {
    const fromPackage = {
      canEditChecklist: false,
      canRegistrarTemperatura: false,
      canFinalizar: false,
      canGerenciarPaletes: true,
      canConferirItens: true,
    };

    expect(
      deriveCapabilitiesFromProcess({
        capabilities: fromPackage,
        papelDoUsuario: 'responsavel',
        souApoio: false,
        atribuidoAMim: true,
      }),
    ).toEqual(fromPackage);
  });

  it('deriva permissões de apoio a partir do header', () => {
    expect(
      deriveCapabilitiesFromProcessHeader({
        papel: 'apoio',
        souApoio: true,
      }),
    ).toEqual(APOIO_CAPABILITIES);
  });

  it('deriva permissões de responsável a partir do header', () => {
    expect(
      deriveCapabilitiesFromProcessHeader({
        papel: 'responsavel',
        atribuidoAMim: true,
      }),
    ).toEqual(RESPONSAVEL_CAPABILITIES);
  });

  it('deriva permissões de responsável para demanda disponível sem alocação', () => {
    expect(
      deriveCapabilitiesFromProcessHeader({
        papel: null,
        souApoio: false,
        atribuidoAMim: false,
      }),
    ).toEqual(RESPONSAVEL_CAPABILITIES);
  });

  it('ignora capabilities restritivas do pacote quando papelDoUsuario é null', () => {
    expect(
      deriveCapabilitiesFromProcess({
        capabilities: {
          canEditChecklist: false,
          canRegistrarTemperatura: false,
          canFinalizar: false,
          canGerenciarPaletes: false,
          canConferirItens: false,
        },
        papelDoUsuario: null,
        souApoio: false,
        atribuidoAMim: false,
      }),
    ).toEqual(RESPONSAVEL_CAPABILITIES);
  });

  it('usa fallback restritivo apenas sem processo', () => {
    expect(deriveCapabilitiesFromProcess(undefined)).toEqual(
      RESTRICTIVE_CAPABILITIES,
    );
  });
});
