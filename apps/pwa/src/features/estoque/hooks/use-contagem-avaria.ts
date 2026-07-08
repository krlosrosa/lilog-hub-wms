import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';
import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import { CONTAGEM_AVARIA_MOTIVO_OPTIONS } from '../lib/avaria-labels';
import {
  addContagemAvaria,
  createContagemAvariaId,
  normalizeContagemEndereco,
} from '../lib/contagem-avarias-store';
import { useContagemEnderecos } from './use-contagem-enderecos';
import {
  contagemAvariaFormSchema,
  type ContagemAvariaForm,
  type ContagemAvariaOrigem,
} from '../types/estoque.schema';

const MIN_PHOTOS = 2;

const DEFAULT_VALUES: ContagemAvariaForm = {
  motivo: '',
  quantidadeCaixas: 0,
  quantidadeUnidades: 0,
};

export interface ContagemAvariaContext {
  endereco: string;
  sku: string;
  descricao: string;
  lote?: string;
}

export function useContagemAvaria({
  demandaId,
  origem,
  endereco: enderecoParam,
  codigoProduto,
  itemId,
}: {
  demandaId: string;
  origem: ContagemAvariaOrigem;
  endereco?: string;
  codigoProduto?: string;
  itemId?: string;
}) {
  const navigate = useNavigate();
  const { enderecos } = useContagemEnderecos(demandaId);
  const enderecoItem = itemId
    ? enderecos.find((item) => item.id === itemId)
    : enderecos.find(
        (item) =>
          enderecoParam?.trim() &&
          item.endereco.trim().toUpperCase() === enderecoParam.trim().toUpperCase(),
      );
  const saldoEsperado = enderecoItem?.saldoEsperado?.[0];

  const { photos, capture, remove, getPhotoIds, hiddenInput } = usePhotoCapture({
    relatedId: `contagem-avaria-${demandaId}-${origem}`,
  });
  const { mutate, isPending: isSubmitting } = useOfflineMutation();

  const form = useForm<ContagemAvariaForm>({
    resolver: zodResolver(contagemAvariaFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const enderecoValidacao =
    enderecoParam?.trim() || enderecoItem?.endereco || '—';

  const context: ContagemAvariaContext =
    origem === 'validacao'
      ? {
          endereco: enderecoValidacao,
          sku: saldoEsperado?.sku ?? '—',
          descricao: saldoEsperado?.nome ?? 'Produto do endereço',
          lote: saldoEsperado?.lote || undefined,
        }
      : {
          endereco: enderecoParam?.trim() || '—',
          sku: codigoProduto?.trim() || '—',
          descricao: codigoProduto?.trim()
            ? `Produto ${codigoProduto.trim()}`
            : 'Informe o produto na contagem antes de registrar',
        };

  const backPath =
    origem === 'validacao'
      ? '/estoque/contagem/$id/validacao'
      : '/estoque/contagem/$id/cega';

  const clearPhotos = useCallback(async () => {
    await Promise.all(photos.map((photo) => remove(photo.id)));
  }, [photos, remove]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const photoIds = getPhotoIds();
    if (photoIds.length < MIN_PHOTOS) {
      form.setError('root', {
        message: `Anexe pelo menos ${MIN_PHOTOS} fotos da avaria.`,
      });
      return;
    }

    const endpoint = itemId
      ? `/estoque/contagem/demands/${encodeURIComponent(demandaId)}/enderecos/${encodeURIComponent(itemId)}/avaria`
      : `/estoque/contagem/demands/${encodeURIComponent(demandaId)}/avarias`;

    await mutate({
      endpoint,
      method: 'POST',
      payload: {
        demandaId,
        origem,
        endereco: context.endereco,
        sku: context.sku,
        ...values,
        photoCount: photoIds.length,
      },
      photoIds,
      label: `Avaria inventário ${demandaId}`,
    });

    const enderecoNorm = normalizeContagemEndereco(context.endereco);
    if (enderecoNorm && enderecoNorm !== '—') {
      addContagemAvaria({
        id: createContagemAvariaId(),
        demandaId,
        endereco: context.endereco,
        motivo: values.motivo,
        quantidadeCaixas: values.quantidadeCaixas,
        quantidadeUnidades: values.quantidadeUnidades,
        photoCount: photoIds.length,
        sku: context.sku !== '—' ? context.sku : undefined,
        registradoEm: new Date().toISOString(),
      });
    }

    form.reset(DEFAULT_VALUES);
    await clearPhotos();

    void navigate({
      to: backPath,
      params: { id: demandaId },
    });
  });

  return {
    state: {
      demandaId,
      origem,
      context,
      form,
      photos,
      isSubmitting,
      errors: form.formState.errors,
      minPhotos: MIN_PHOTOS,
      motivoOptions: CONTAGEM_AVARIA_MOTIVO_OPTIONS,
      backPath,
    },
    actions: {
      capture,
      removePhoto: remove,
      handleSubmit,
      register: form.register,
      hiddenInput,
    },
  };
}
