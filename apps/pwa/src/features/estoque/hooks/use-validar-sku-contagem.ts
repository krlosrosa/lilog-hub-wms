import { useCallback, useEffect, useRef, useState } from 'react';

import {
  SKU_INVALIDO_MSG,
  validarSkuContagem,
  type SkuContagemValidado,
} from '../lib/validar-sku-contagem';

const VALIDATION_DEBOUNCE_MS = 400;

export type SkuContagemValidationState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'valid'; produto: SkuContagemValidado }
  | { status: 'invalid'; message: string };

export function useValidarSkuContagem(codigo: string) {
  const [validation, setValidation] = useState<SkuContagemValidationState>({
    status: 'idle',
  });
  const requestIdRef = useRef(0);

  const resetValidation = useCallback(() => {
    requestIdRef.current += 1;
    setValidation({ status: 'idle' });
  }, []);

  const validateNow = useCallback(async (value: string) => {
    const trimmed = value.trim();
    const requestId = ++requestIdRef.current;

    if (!trimmed) {
      setValidation({ status: 'idle' });
      return null;
    }

    setValidation({ status: 'validating' });

    try {
      const produto = await validarSkuContagem(trimmed);
      if (requestId !== requestIdRef.current) {
        return null;
      }

      if (!produto) {
        setValidation({ status: 'invalid', message: SKU_INVALIDO_MSG });
        return null;
      }

      setValidation({ status: 'valid', produto });
      return produto;
    } catch {
      if (requestId !== requestIdRef.current) {
        return null;
      }

      setValidation({
        status: 'invalid',
        message: 'Não foi possível validar o SKU. Tente novamente.',
      });
      return null;
    }
  }, []);

  useEffect(() => {
    const trimmed = codigo.trim();
    if (!trimmed) {
      resetValidation();
      return;
    }

    const timer = window.setTimeout(() => {
      void validateNow(trimmed);
    }, VALIDATION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [codigo, resetValidation, validateNow]);

  const isSkuValid = validation.status === 'valid';
  const isSkuValidating = validation.status === 'validating';
  const codigoInformado = codigo.trim();
  const codigoInvalido =
    Boolean(codigoInformado) &&
    validation.status === 'invalid';
  const skuStepError =
    validation.status === 'invalid' ? validation.message : undefined;

  return {
    validation,
    isSkuValid,
    isSkuValidating,
    codigoInvalido,
    skuStepError,
    resetValidation,
    validateNow,
  };
}
