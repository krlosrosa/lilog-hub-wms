import type { ProcessRecord, RecebimentoCapabilities } from '../local-db/schema';

export const RESTRICTIVE_CAPABILITIES: RecebimentoCapabilities = {
  canEditChecklist: false,
  canRegistrarTemperatura: false,
  canFinalizar: false,
  canGerenciarPaletes: false,
  canConferirItens: false,
};

export const RESPONSAVEL_CAPABILITIES: RecebimentoCapabilities = {
  canEditChecklist: true,
  canRegistrarTemperatura: true,
  canFinalizar: true,
  canGerenciarPaletes: true,
  canConferirItens: true,
};

export const APOIO_CAPABILITIES: RecebimentoCapabilities = {
  canEditChecklist: false,
  canRegistrarTemperatura: false,
  canFinalizar: false,
  canGerenciarPaletes: true,
  canConferirItens: true,
};

type ProcessRoleInput = Pick<
  ProcessRecord,
  'capabilities' | 'papelDoUsuario' | 'souApoio' | 'atribuidoAMim'
>;

export function deriveCapabilitiesFromProcess(
  process: ProcessRoleInput | undefined | null,
): RecebimentoCapabilities {
  if (!process) {
    return RESTRICTIVE_CAPABILITIES;
  }

  if (process.capabilities) {
    return process.capabilities;
  }

  const papel =
    process.papelDoUsuario ??
    (process.souApoio ? 'apoio' : process.atribuidoAMim ? 'responsavel' : null);

  if (papel === 'responsavel') {
    return RESPONSAVEL_CAPABILITIES;
  }

  if (papel === 'apoio') {
    return APOIO_CAPABILITIES;
  }

  return RESTRICTIVE_CAPABILITIES;
}

export function deriveCapabilitiesFromProcessHeader(input: {
  papel?: 'responsavel' | 'apoio' | null;
  souApoio?: boolean;
  atribuidoAMim?: boolean;
}): RecebimentoCapabilities {
  return deriveCapabilitiesFromProcess({
    capabilities: undefined,
    papelDoUsuario: input.papel ?? null,
    souApoio: input.souApoio === true,
    atribuidoAMim: input.atribuidoAMim === true,
  });
}
