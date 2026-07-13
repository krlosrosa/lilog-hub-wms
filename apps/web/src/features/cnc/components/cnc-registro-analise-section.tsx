'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@lilog/ui';
import { Check, Loader2, MessageSquareText, Printer } from 'lucide-react';

import { useCncObservacao } from '@/features/cnc/hooks/use-cnc-observacao';
import { useCncOpcoesImpressao } from '@/features/cnc/hooks/use-cnc-opcoes-impressao';
import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  CNC_LOCAL_AVARIA_OPCOES,
  CNC_ORIGEM_AVARIA_OPCOES,
  CNC_PALLET_AVARIADO_OPCOES,
  CNC_TIPO_CARGA_OPCOES,
  resolverOpcoesImpressao,
  type CncImpressaoOpcoes,
  type CncLocalAvariaImpressao,
} from '@/features/cnc/types/cnc-impressao.schema';

export type CncRegistroAnaliseSalvarActions = {
  salvarTudo: () => Promise<void>;
};

type CncRegistroAnaliseSectionProps = {
  cnc: CncDetalhe;
  podeEditar: boolean;
  onSalvo?: (patch: Partial<CncDetalhe>) => void;
  onOpcoesChange?: (opcoes: CncImpressaoOpcoes) => void;
  onRegisterSalvar?: (actions: CncRegistroAnaliseSalvarActions) => void;
};

type ChipGroupProps<T extends string> = {
  label: string;
  hint?: string;
  opcoes: Array<{ value: T; label: string }>;
  valor: T | null;
  disabled?: boolean;
  onChange: (valor: T) => void;
};

function ChipGroup<T extends string>({
  label,
  hint,
  opcoes,
  valor,
  disabled = false,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-[11px] font-semibold text-foreground">{label}</p>
        {hint ? (
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((opcao) => {
          const selecionado = valor === opcao.value;

          return (
            <button
              key={opcao.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opcao.value)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                disabled && 'cursor-not-allowed opacity-60',
                selecionado
                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                  : 'border-outline-variant bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {selecionado ? <Check className="size-2.5" aria-hidden /> : null}
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ChipMultiGroupProps = {
  label: string;
  hint?: string;
  valores: CncLocalAvariaImpressao[];
  disabled?: boolean;
  onChange: (valores: CncLocalAvariaImpressao[]) => void;
};

function ChipMultiGroup({
  label,
  hint,
  valores,
  disabled = false,
  onChange,
}: ChipMultiGroupProps) {
  const alternar = (valor: CncLocalAvariaImpressao) => {
    if (valores.includes(valor)) {
      onChange(valores.filter((item) => item !== valor));
      return;
    }

    onChange([...valores, valor]);
  };

  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-[11px] font-semibold text-foreground">{label}</p>
        {hint ? (
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CNC_LOCAL_AVARIA_OPCOES.map((opcao) => {
          const selecionado = valores.includes(opcao.value);

          return (
            <button
              key={opcao.value}
              type="button"
              disabled={disabled}
              onClick={() => alternar(opcao.value)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                disabled && 'cursor-not-allowed opacity-60',
                selecionado
                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                  : 'border-outline-variant bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {selecionado ? <Check className="size-2.5" aria-hidden /> : null}
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CncRegistroAnaliseSection({
  cnc,
  podeEditar,
  onSalvo,
  onOpcoesChange,
  onRegisterSalvar,
}: CncRegistroAnaliseSectionProps) {
  const { salvar: salvarObservacao, salvando: salvandoObservacao } =
    useCncObservacao(cnc.id, (dados) => {
      onSalvo?.({
        observacao: dados.observacao,
        updatedAt: dados.updatedAt,
      });
    });
  const { salvar: salvarOpcoes, salvando: salvandoOpcoes } =
    useCncOpcoesImpressao(cnc.id, (dados) => {
      onSalvo?.({
        opcoesImpressao: dados.opcoesImpressao,
        updatedAt: dados.updatedAt,
      });
    });

  const [observacao, setObservacao] = useState(cnc.observacao ?? '');
  const [opcoes, setOpcoes] = useState<CncImpressaoOpcoes>(
    resolverOpcoesImpressao(cnc.opcoesImpressao),
  );
  const saveOpcoesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opcoesRef = useRef(opcoes);
  const observacaoRef = useRef(observacao);

  useEffect(() => {
    opcoesRef.current = opcoes;
  }, [opcoes]);

  useEffect(() => {
    observacaoRef.current = observacao;
  }, [observacao]);

  useEffect(() => {
    return () => {
      if (saveOpcoesTimeoutRef.current) {
        clearTimeout(saveOpcoesTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setObservacao(cnc.observacao ?? '');
    const resolvidas = resolverOpcoesImpressao(cnc.opcoesImpressao);
    setOpcoes(resolvidas);
    onOpcoesChange?.(resolvidas);
  }, [cnc.id]);

  const handleBlurObservacao = () => {
    const valorAtual = observacao.trim() || null;
    const valorSalvo = cnc.observacao?.trim() || null;

    if (valorAtual === valorSalvo || !podeEditar) {
      return;
    }

    void salvarObservacao(valorAtual);
  };

  const atualizarOpcoes = <K extends keyof CncImpressaoOpcoes>(
    campo: K,
    valor: CncImpressaoOpcoes[K],
  ) => {
    const proximas = { ...opcoes, [campo]: valor };
    setOpcoes(proximas);
    onOpcoesChange?.(proximas);

    if (podeEditar) {
      if (saveOpcoesTimeoutRef.current) {
        clearTimeout(saveOpcoesTimeoutRef.current);
      }

      saveOpcoesTimeoutRef.current = setTimeout(() => {
        void salvarOpcoes(proximas);
      }, 400);
    }
  };

  const salvarTudo = useCallback(async () => {
    if (saveOpcoesTimeoutRef.current) {
      clearTimeout(saveOpcoesTimeoutRef.current);
      saveOpcoesTimeoutRef.current = null;
    }

    if (podeEditar) {
      await salvarOpcoes(opcoesRef.current);

      const valorAtual = observacaoRef.current.trim() || null;
      const valorSalvo = cnc.observacao?.trim() || null;

      if (valorAtual !== valorSalvo) {
        await salvarObservacao(valorAtual);
      }
    }
  }, [cnc.observacao, podeEditar, salvarObservacao, salvarOpcoes]);

  useEffect(() => {
    onRegisterSalvar?.({ salvarTudo });
  }, [onRegisterSalvar, salvarTudo]);

  const salvando = salvandoObservacao || salvandoOpcoes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {salvando ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-low px-2 py-0.5 text-[10px] text-muted-foreground">
            <Loader2 className="size-2.5 animate-spin" aria-hidden />
            Salvando
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-low px-2 py-0.5 text-[10px] text-muted-foreground">
            <Check className="size-2.5 text-tertiary" aria-hidden />
            Auto-save
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <MessageSquareText className="size-3.5 text-primary" aria-hidden />
          <h3 className="text-xs font-semibold text-foreground">Observação</h3>
        </div>

        <textarea
          value={observacao}
          onChange={(event) => setObservacao(event.target.value)}
          onBlur={handleBlurObservacao}
          rows={5}
          disabled={!podeEditar || salvandoObservacao}
          className={cn(
            'w-full resize-y rounded-lg border border-outline-variant bg-surface-low/80 px-3 py-2',
            'text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60',
            'transition-shadow focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
          placeholder="Contexto, decisões ou pontos de atenção..."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Printer className="size-3.5 text-secondary" aria-hidden />
          <h3 className="text-xs font-semibold text-foreground">
            Opções de impressão
          </h3>
        </div>

        <ChipGroup
          label="Origem da avaria"
          opcoes={CNC_ORIGEM_AVARIA_OPCOES}
          valor={opcoes.origemAvaria}
          disabled={!podeEditar}
          onChange={(valor) => atualizarOpcoes('origemAvaria', valor)}
        />
        <ChipGroup
          label="Tipo de carga"
          opcoes={CNC_TIPO_CARGA_OPCOES}
          valor={opcoes.tipoCarga}
          disabled={!podeEditar}
          onChange={(valor) => atualizarOpcoes('tipoCarga', valor)}
        />
        <ChipGroup
          label="Pallet avariado"
          opcoes={CNC_PALLET_AVARIADO_OPCOES}
          valor={opcoes.palletAvariado}
          disabled={!podeEditar}
          onChange={(valor) => atualizarOpcoes('palletAvariado', valor)}
        />
        <ChipMultiGroup
          label="Local da avaria/pallet"
          hint="Pode selecionar mais de uma opção"
          valores={opcoes.localAvaria}
          disabled={!podeEditar}
          onChange={(valores) => atualizarOpcoes('localAvaria', valores)}
        />
      </div>
    </div>
  );
}
