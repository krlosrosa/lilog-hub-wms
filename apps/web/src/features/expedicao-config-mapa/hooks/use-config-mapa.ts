'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  DEFAULT_GROUPING_RULES,
  MOCK_TRANSPORTES,
} from '@/features/expedicao-config-mapa/mocks/config-mapa.mock';
import {
  buildMapaSeparacaoPreview,
  estimateMapCount,
} from '@/features/expedicao-config-mapa/lib/build-mapa-separacao-preview';
import type {
  ConferenceClassificationField,
  GroupingRuleKey,
  GroupingRules,
  PalletizationConfig,
  PalletizationType,
  PrintConfig,
  PrintType,
  Transport,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';

const DEFAULT_PALLETIZATION: PalletizationConfig = {
  enabled: false,
  type: 'full',
  percentual: 65,
  linhas: 20,
  quantidadeUnidades: 50,
};

const DEFAULT_PRINT_CONFIG: PrintConfig = {
  tipoImpressao: 'transporte',
  conferenciaSegueSeparacao: true,
  campoClassificacaoConferencia: 'cliente',
};

function createGroupId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useConfigMapa() {
  const [transports] = useState<Transport[]>(() => [...MOCK_TRANSPORTES]);
  const [transportFilter, setTransportFilter] = useState('');
  const [groupingRules, setGroupingRules] = useState<GroupingRules>(
    () => structuredClone(DEFAULT_GROUPING_RULES),
  );
  const [palletization, setPalletization] =
    useState<PalletizationConfig>(DEFAULT_PALLETIZATION);
  const [printConfig, setPrintConfig] =
    useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);

  const mapPreviews = useMemo(
    () =>
      buildMapaSeparacaoPreview({
        groupingRules,
        palletization,
        printConfig,
        transports,
      }),
    [groupingRules, palletization, printConfig, transports],
  );

  const filteredTransports = useMemo(() => {
    const query = transportFilter.trim().toLowerCase();
    if (!query) return transports;

    return transports.filter(
      (transport) =>
        transport.placa.toLowerCase().includes(query) ||
        transport.transportadora?.toLowerCase().includes(query),
    );
  }, [transportFilter, transports]);

  const toggleRuleEnabled = useCallback((rule: GroupingRuleKey) => {
    setGroupingRules((current) => ({
      ...current,
      [rule]: {
        ...current[rule],
        enabled: !current[rule].enabled,
      },
    }));
  }, []);

  const toggleRuleCollapsed = useCallback((rule: GroupingRuleKey) => {
    setGroupingRules((current) => ({
      ...current,
      [rule]: {
        ...current[rule],
        collapsed: !current[rule].collapsed,
      },
    }));
  }, []);

  const addSegregateItem = useCallback((item: string) => {
    setGroupingRules((current) => {
      if (current.segregate.items.includes(item)) return current;
      return {
        ...current,
        segregate: {
          ...current.segregate,
          items: [...current.segregate.items, item],
        },
      };
    });
  }, []);

  const removeSegregateItem = useCallback((item: string) => {
    setGroupingRules((current) => ({
      ...current,
      segregate: {
        ...current.segregate,
        items: current.segregate.items.filter((value) => value !== item),
      },
    }));
  }, []);

  const addGroup = useCallback((rule: Exclude<GroupingRuleKey, 'segregate'>) => {
    setGroupingRules((current) => ({
      ...current,
      [rule]: {
        ...current[rule],
        groups: [
          ...current[rule].groups,
          {
            id: createGroupId(rule),
            name: '',
            items: [],
            collapsed: false,
          },
        ],
      },
    }));
  }, []);

  const removeGroup = useCallback(
    (rule: Exclude<GroupingRuleKey, 'segregate'>, groupId: string) => {
      setGroupingRules((current) => ({
        ...current,
        [rule]: {
          ...current[rule],
          groups: current[rule].groups.filter((group) => group.id !== groupId),
        },
      }));
    },
    [],
  );

  const updateGroupName = useCallback(
    (
      rule: Exclude<GroupingRuleKey, 'segregate'>,
      groupId: string,
      name: string,
    ) => {
      setGroupingRules((current) => ({
        ...current,
        [rule]: {
          ...current[rule],
          groups: current[rule].groups.map((group) =>
            group.id === groupId ? { ...group, name } : group,
          ),
        },
      }));
    },
    [],
  );

  const toggleGroupCollapsed = useCallback(
    (rule: Exclude<GroupingRuleKey, 'segregate'>, groupId: string) => {
      setGroupingRules((current) => ({
        ...current,
        [rule]: {
          ...current[rule],
          groups: current[rule].groups.map((group) =>
            group.id === groupId
              ? { ...group, collapsed: !group.collapsed }
              : group,
          ),
        },
      }));
    },
    [],
  );

  const addGroupItem = useCallback(
    (
      rule: Exclude<GroupingRuleKey, 'segregate'>,
      groupId: string,
      item: string,
    ) => {
      setGroupingRules((current) => ({
        ...current,
        [rule]: {
          ...current[rule],
          groups: current[rule].groups.map((group) => {
            if (group.id !== groupId || group.items.includes(item)) return group;
            return { ...group, items: [...group.items, item] };
          }),
        },
      }));
    },
    [],
  );

  const removeGroupItem = useCallback(
    (
      rule: Exclude<GroupingRuleKey, 'segregate'>,
      groupId: string,
      item: string,
    ) => {
      setGroupingRules((current) => ({
        ...current,
        [rule]: {
          ...current[rule],
          groups: current[rule].groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  items: group.items.filter((value) => value !== item),
                }
              : group,
          ),
        },
      }));
    },
    [],
  );

  const setPalletizationEnabled = useCallback((enabled: boolean) => {
    setPalletization((current) => ({ ...current, enabled }));
  }, []);

  const setPalletizationType = useCallback((type: PalletizationType) => {
    setPalletization((current) => ({ ...current, type }));
  }, []);

  const setPercentual = useCallback((percentual: number) => {
    setPalletization((current) => ({
      ...current,
      percentual: Math.min(100, Math.max(0, percentual)),
    }));
  }, []);

  const setLinhas = useCallback((linhas: number) => {
    setPalletization((current) => ({
      ...current,
      linhas: Math.max(1, Math.floor(linhas) || 1),
    }));
  }, []);

  const setQuantidadeUnidades = useCallback((quantidadeUnidades: number) => {
    setPalletization((current) => ({
      ...current,
      quantidadeUnidades: Math.max(1, Math.floor(quantidadeUnidades) || 1),
    }));
  }, []);

  const setTipoImpressao = useCallback((tipoImpressao: PrintType) => {
    setPrintConfig((current) => ({ ...current, tipoImpressao }));
  }, []);

  const setConferenciaSegueSeparacao = useCallback((conferenciaSegueSeparacao: boolean) => {
    setPrintConfig((current) => ({ ...current, conferenciaSegueSeparacao }));
  }, []);

  const setCampoClassificacaoConferencia = useCallback(
    (campoClassificacaoConferencia: ConferenceClassificationField) => {
      setPrintConfig((current) => ({ ...current, campoClassificacaoConferencia }));
    },
    [],
  );

  const validateGroupingRules = useCallback(() => {
    const { segregate, byClient, byTransport, byShipment } = groupingRules;

    if (
      !segregate.enabled &&
      !byClient.enabled &&
      !byTransport.enabled &&
      !byShipment.enabled
    ) {
      toast.error('Ative ao menos uma regra de agrupamento.');
      return false;
    }

    if (segregate.enabled && segregate.items.length === 0) {
      toast.error('Adicione clientes para segregar.');
      return false;
    }

    const validateGroups = (
      label: string,
      groups: typeof byClient.groups,
    ) => {
      if (groups.length === 0) {
        toast.error(`Crie ao menos um grupo em "${label}".`);
        return false;
      }

      for (const group of groups) {
        if (!group.name.trim()) {
          toast.error(`Informe o nome do grupo em "${label}".`);
          return false;
        }
        if (group.items.length === 0) {
          toast.error(`Adicione itens ao grupo "${group.name}" em "${label}".`);
          return false;
        }
      }

      return true;
    };

    if (byClient.enabled && !validateGroups('Agrupar por Cliente', byClient.groups)) {
      return false;
    }

    if (
      byTransport.enabled &&
      !validateGroups('Agrupar por Transporte', byTransport.groups)
    ) {
      return false;
    }

    if (
      byShipment.enabled &&
      !validateGroups('Agrupar por Remessa', byShipment.groups)
    ) {
      return false;
    }

    return true;
  }, [groupingRules]);

  const onGenerate = useCallback(async () => {
    if (!validateGroupingRules()) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    toast.success(
      `${estimateMapCount(mapPreviews)} mapa(s) gerado(s) com sucesso.`,
    );
  }, [mapPreviews, validateGroupingRules]);

  const onCancel = useCallback(() => {
    setTransportFilter('');
    setGroupingRules(structuredClone(DEFAULT_GROUPING_RULES));
    setPalletization(DEFAULT_PALLETIZATION);
    setPrintConfig(DEFAULT_PRINT_CONFIG);
    toast.message('Operação cancelada. Configurações restauradas.');
  }, []);

  return {
    transports,
    filteredTransports,
    transportFilter,
    setTransportFilter,
    groupingRules,
    toggleRuleEnabled,
    toggleRuleCollapsed,
    addSegregateItem,
    removeSegregateItem,
    addGroup,
    removeGroup,
    updateGroupName,
    toggleGroupCollapsed,
    addGroupItem,
    removeGroupItem,
    palletization,
    setPalletizationEnabled,
    setPalletizationType,
    setPercentual,
    setLinhas,
    setQuantidadeUnidades,
    printConfig,
    setTipoImpressao,
    setConferenciaSegueSeparacao,
    setCampoClassificacaoConferencia,
    mapPreviews,
    isGenerating,
    onGenerate,
    onCancel,
  };
}

export type UseConfigMapaReturn = ReturnType<typeof useConfigMapa>;
