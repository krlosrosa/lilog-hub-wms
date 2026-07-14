'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  downloadImportTemplate,
  parseImportFile,
  type ParsedImportRow,
} from '@/features/pessoas/lib/import-excel';
import { bulkImportPessoas } from '@/features/pessoas/lib/pessoa-api';
import type { BulkImportResult } from '@/features/pessoas/types/pessoa.api';
import { listEquipes } from '@/features/sessao-operacao/lib/sessao-operacao-api';
import type { EquipeApi } from '@/features/sessao-operacao/types/equipe.api';

export type ImportPessoasStep = 'equipes' | 'preview' | 'resultado';

type UseImportPessoasOptions = {
  open: boolean;
  onSuccess?: () => void;
};

export function useImportPessoas({ open, onSuccess }: UseImportPessoasOptions) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? '';

  const [step, setStep] = useState<ImportPessoasStep>('equipes');
  const [equipes, setEquipes] = useState<EquipeApi[]>([]);
  const [equipesSelecionadas, setEquipesSelecionadas] = useState<string[]>([]);
  const [isLoadingEquipes, setIsLoadingEquipes] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [resultado, setResultado] = useState<BulkImportResult | null>(null);

  const reset = useCallback(() => {
    setStep('equipes');
    setEquipesSelecionadas([]);
    setRows([]);
    setResultado(null);
    setIsParsing(false);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !unidadeId) {
      setEquipes([]);
      return;
    }

    async function loadEquipes() {
      setIsLoadingEquipes(true);

      try {
        const response = await listEquipes({ unidadeId, limit: 100 });
        setEquipes(response.items);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro ao carregar equipes';
        toast.error(message);
        setEquipes([]);
      } finally {
        setIsLoadingEquipes(false);
      }
    }

    void loadEquipes();
  }, [open, unidadeId]);

  const equipesParaTemplate = useMemo(
    () => equipes.filter((equipe) => equipesSelecionadas.includes(equipe.id)),
    [equipes, equipesSelecionadas],
  );

  const rowsAgrupadas = useMemo(() => {
    const grupos = new Map<string, ParsedImportRow[]>();

    for (const row of rows) {
      const key = row.equipeId || row.sheetName;
      const atual = grupos.get(key) ?? [];
      atual.push(row);
      grupos.set(key, atual);
    }

    return Array.from(grupos.entries()).map(([key, grupoRows]) => ({
      key,
      equipeNome: grupoRows[0]?.equipeNome ?? key,
      rows: grupoRows,
    }));
  }, [rows]);

  const totalValidos = useMemo(
    () => rows.filter((row) => row.erros.length === 0).length,
    [rows],
  );

  const totalInvalidos = useMemo(
    () => rows.filter((row) => row.erros.length > 0).length,
    [rows],
  );

  const toggleEquipe = useCallback((equipeId: string) => {
    setEquipesSelecionadas((atual) =>
      atual.includes(equipeId)
        ? atual.filter((id) => id !== equipeId)
        : [...atual, equipeId],
    );
  }, []);

  const selecionarTodasEquipes = useCallback(() => {
    setEquipesSelecionadas(equipes.map((equipe) => equipe.id));
  }, [equipes]);

  const baixarModelo = useCallback(() => {
    if (equipesParaTemplate.length === 0) {
      toast.error('Selecione ao menos uma equipe');
      return;
    }

    downloadImportTemplate(equipesParaTemplate);
  }, [equipesParaTemplate]);

  const processarArquivo = useCallback(
    async (file: File) => {
      setIsParsing(true);

      try {
        const parsed = await parseImportFile(file, equipes);
        setRows(parsed.rows);
        setStep('preview');

        if (parsed.rows.length === 0) {
          toast.error('Nenhum funcionário encontrado no arquivo');
        } else if (parsed.totalInvalidos > 0) {
          toast.warning(
            `${parsed.totalInvalidos} linha(s) com pendências de validação`,
          );
        } else {
          toast.success(`${parsed.totalValidos} funcionário(s) prontos para importar`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao ler planilha';
        toast.error(message);
      } finally {
        setIsParsing(false);
      }
    },
    [equipes],
  );

  const corrigirEquipeRow = useCallback(
    (rowId: string, equipeId: string) => {
      const equipe = equipes.find((item) => item.id === equipeId);

      if (!equipe) {
        return;
      }

      setRows((atual) =>
        atual.map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          const erros = row.erros.filter(
            (erro) => erro !== 'Equipe da aba não reconhecida',
          );

          return {
            ...row,
            equipeId: equipe.id,
            equipeNome: equipe.nome,
            erros,
          };
        }),
      );
    },
    [equipes],
  );

  const confirmarImportacao = useCallback(async () => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade operacional');
      return;
    }

    const validRows = rows.filter((row) => row.erros.length === 0);

    if (validRows.length === 0) {
      toast.error('Nenhuma linha válida para importar');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await bulkImportPessoas({
        funcionarios: validRows.map((row) => ({
          unidadeId,
          matricula: row.matricula,
          nome: row.nome,
          cargo: row.cargo,
          dataAdmissao: row.dataAdmissao,
          equipeId: row.equipeId,
          criarUsuario: row.criarUsuario,
          ...(row.criarUsuario && row.senhaInicial
            ? { senhaInicial: row.senhaInicial }
            : {}),
        })),
      });

      setResultado(response);
      setStep('resultado');

      if (response.falhas.length === 0) {
        toast.success(`${response.sucesso} funcionário(s) importados com sucesso`);
        onSuccess?.();
      } else if (response.sucesso > 0) {
        toast.warning(
          `${response.sucesso} importados, ${response.falhas.length} falha(s)`,
        );
        onSuccess?.();
      } else {
        toast.error('Nenhum funcionário foi importado');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao importar funcionários';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess, rows, unidadeId]);

  return {
    step,
    setStep,
    unidadeId,
    equipes,
    equipesSelecionadas,
    equipesParaTemplate,
    isLoadingEquipes,
    isParsing,
    isSubmitting,
    rows,
    rowsAgrupadas,
    totalValidos,
    totalInvalidos,
    resultado,
    toggleEquipe,
    selecionarTodasEquipes,
    baixarModelo,
    processarArquivo,
    corrigirEquipeRow,
    confirmarImportacao,
    reset,
  };
}
