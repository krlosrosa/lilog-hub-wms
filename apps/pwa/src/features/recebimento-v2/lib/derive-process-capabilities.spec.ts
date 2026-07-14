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

  it('usa fallback restritivo sem papel nem capabilities', () => {
    expect(deriveCapabilitiesFromProcess(undefined)).toEqual(
      RESTRICTIVE_CAPABILITIES,
    );
    expect(
      deriveCapabilitiesFromProcess({
        capabilities: undefined,
        papelDoUsuario: null,
        souApoio: false,
        atribuidoAMim: false,
      }),
    ).toEqual(RESTRICTIVE_CAPABILITIES);
  });
});
