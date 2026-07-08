'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import {
  submeterInteracao,
  uploadAnexoInteracao,
  type SubmeterInteracaoInput,
} from '../lib/debitos-api';
import type { InteracaoTipoTransportadora } from '../types/debito.types';

type ArquivoUpload = {
  id: string;
  file: File;
  chave?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

const MAX_ARQUIVOS = 5;
const MAX_TAMANHO_BYTES = 10 * 1024 * 1024;

const TIPOS: InteracaoTipoTransportadora[] = [
  'erro_conferencia',
  'nf_incorreta',
  'avaria_nao_procedente',
  'envio_documento',
  'esclarecimento',
  'outros',
];

export function useSubmeterInteracao(
  processoId: string,
  onSuccess?: () => void,
) {
  const [tipo, setTipo] = useState<InteracaoTipoTransportadora>(
    'erro_conferencia',
  );
  const [descricao, setDescricao] = useState('');
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const temUploadEmProgresso = arquivos.some(
    (arquivo) => arquivo.status === 'pending' || arquivo.status === 'uploading',
  );

  const adicionarArquivos = useCallback(
    async (files: FileList | File[]) => {
      const lista = Array.from(files);

      if (arquivos.length + lista.length > MAX_ARQUIVOS) {
        toast.error(`Máximo de ${MAX_ARQUIVOS} arquivos por mensagem`);
        return;
      }

      for (const file of lista) {
        if (file.size > MAX_TAMANHO_BYTES) {
          toast.error(`${file.name} excede 10 MB`);
          continue;
        }

        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
        const entrada: ArquivoUpload = {
          id,
          file,
          status: 'uploading',
        };

        setArquivos((atual) => [...atual, entrada]);

        try {
          const { chave } = await uploadAnexoInteracao(processoId, file);
          setArquivos((atual) =>
            atual.map((item) =>
              item.id === id ? { ...item, chave, status: 'done' } : item,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Falha no upload';
          setArquivos((atual) =>
            atual.map((item) =>
              item.id === id ? { ...item, status: 'error', error: message } : item,
            ),
          );
          toast.error(message);
        }
      }
    },
    [arquivos.length, processoId],
  );

  const removerArquivo = useCallback((id: string) => {
    setArquivos((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setTipo('erro_conferencia');
    setDescricao('');
    setArquivos([]);
    setIsSubmitting(false);
  }, []);

  const submeter = useCallback(async () => {
    if (descricao.trim().length < 10) {
      toast.error('Descreva sua mensagem com pelo menos 10 caracteres');
      return false;
    }

    if (temUploadEmProgresso) {
      toast.error('Aguarde o término dos uploads');
      return false;
    }

    const anexoChaves = arquivos
      .filter((item) => item.status === 'done' && item.chave)
      .map((item) => item.chave!);

    const payload: SubmeterInteracaoInput = {
      processoId,
      tipo,
      descricao: descricao.trim(),
      anexoChaves,
    };

    setIsSubmitting(true);

    try {
      await submeterInteracao(payload);
      toast.success('Mensagem enviada com sucesso');
      reset();
      onSuccess?.();
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao enviar mensagem',
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    arquivos,
    descricao,
    onSuccess,
    processoId,
    reset,
    temUploadEmProgresso,
    tipo,
  ]);

  return {
    tipo,
    setTipo,
    tiposDisponiveis: TIPOS,
    descricao,
    setDescricao,
    arquivos,
    adicionarArquivos,
    removerArquivo,
    submeter,
    reset,
    isSubmitting,
    temUploadEmProgresso,
  };
}
