'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, ChevronRight, GitBranch, Plus, Trash2 } from 'lucide-react';

import {
  fieldInputClassName,
  panelBodyClassName,
  sectionLabelClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';
import { TagInput } from '@/features/expedicao-config-mapa/components/tag-input';
import {
  MOCK_CLIENTES_SUGESTOES,
  MOCK_REMESSAS_SUGESTOES,
  MOCK_TRANSPORTES_SUGESTOES,
} from '@/features/expedicao-config-mapa/mocks/config-mapa.mock';
import {
  GROUPING_RULE_ITEM_LABELS,
  GROUPING_RULE_LABELS,
  type GroupingGroup,
  type GroupingRuleKey,
  type GroupingRules,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';

type GroupingRulesPanelProps = {
  groupingRules: GroupingRules;
  onToggleRuleEnabled: (rule: GroupingRuleKey) => void;
  onToggleRuleCollapsed: (rule: GroupingRuleKey) => void;
  onAddSegregateItem: (item: string) => void;
  onRemoveSegregateItem: (item: string) => void;
  onAddGroup: (rule: Exclude<GroupingRuleKey, 'segregate'>) => void;
  onRemoveGroup: (
    rule: Exclude<GroupingRuleKey, 'segregate'>,
    groupId: string,
  ) => void;
  onUpdateGroupName: (
    rule: Exclude<GroupingRuleKey, 'segregate'>,
    groupId: string,
    name: string,
  ) => void;
  onToggleGroupCollapsed: (
    rule: Exclude<GroupingRuleKey, 'segregate'>,
    groupId: string,
  ) => void;
  onAddGroupItem: (
    rule: Exclude<GroupingRuleKey, 'segregate'>,
    groupId: string,
    item: string,
  ) => void;
  onRemoveGroupItem: (
    rule: Exclude<GroupingRuleKey, 'segregate'>,
    groupId: string,
    item: string,
  ) => void;
};

const GROUP_RULE_KEYS = ['byClient', 'byTransport', 'byShipment'] as const;

function getSuggestions(rule: Exclude<GroupingRuleKey, 'segregate'>) {
  switch (rule) {
    case 'byClient':
      return MOCK_CLIENTES_SUGESTOES;
    case 'byTransport':
      return MOCK_TRANSPORTES_SUGESTOES;
    case 'byShipment':
      return MOCK_REMESSAS_SUGESTOES;
  }
}

type GroupCardProps = {
  rule: Exclude<GroupingRuleKey, 'segregate'>;
  group: GroupingGroup;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
};

function GroupCard({
  rule,
  group,
  onToggleCollapsed,
  onRemove,
  onNameChange,
  onAddItem,
  onRemoveItem,
}: GroupCardProps) {
  const itemLabel = GROUPING_RULE_ITEM_LABELS[rule];

  return (
    <div className="rounded-md border border-outline-variant/60 bg-background/50">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              !group.collapsed && 'rotate-90',
            )}
            aria-hidden
          />
          <span className="truncate text-[11px] font-semibold text-foreground">
            {group.name.trim() || 'Novo grupo'}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {group.items.length}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
          aria-label="Remover grupo"
        >
          <Trash2 className="size-3" aria-hidden />
        </button>
      </div>

      {!group.collapsed && (
        <div className="space-y-2 border-t border-outline-variant/40 px-2 pb-2 pt-1.5">
          <input
            type="text"
            value={group.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Nome do grupo"
            className={fieldInputClassName}
          />
          <TagInput
            tags={group.items}
            onAdd={onAddItem}
            onRemove={onRemoveItem}
            suggestions={getSuggestions(rule)}
            placeholder={`Adicionar ${itemLabel.toLowerCase()}...`}
          />
        </div>
      )}
    </div>
  );
}

type RuleSectionProps = {
  label: string;
  enabled: boolean;
  collapsed: boolean;
  onToggleEnabled: () => void;
  onToggleCollapsed: () => void;
  children: ReactNode;
};

function RuleSection({
  label,
  enabled,
  collapsed,
  onToggleEnabled,
  onToggleCollapsed,
  children,
}: RuleSectionProps) {
  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        enabled
          ? 'border-outline-variant bg-surface-low/30'
          : 'border-outline-variant/50 bg-surface-low/10',
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              !collapsed && 'rotate-90',
            )}
            aria-hidden
          />
          <span
            className={cn(
              'truncate text-xs font-medium',
              enabled ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
        </button>
        <SwitchToggle
          checked={enabled}
          onChange={onToggleEnabled}
          label={label}
        />
      </div>

      {!collapsed && enabled && (
        <div className="space-y-2 border-t border-outline-variant/40 px-2 pb-2 pt-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

export function GroupingRulesPanel({
  groupingRules,
  onToggleRuleEnabled,
  onToggleRuleCollapsed,
  onAddSegregateItem,
  onRemoveSegregateItem,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroupName,
  onToggleGroupCollapsed,
  onAddGroupItem,
  onRemoveGroupItem,
}: GroupingRulesPanelProps) {
  const { segregate } = groupingRules;

  return (
    <div className={cn(panelBodyClassName, 'space-y-3 border-t border-outline-variant pt-3')}>
      <div className="flex items-center gap-2">
        <GitBranch className="size-3.5 text-primary" aria-hidden />
        <h3 className={sectionLabelClassName}>Agrupamento</h3>
      </div>

      <div className="space-y-2">
        <RuleSection
          label={GROUPING_RULE_LABELS.segregate}
          enabled={segregate.enabled}
          collapsed={segregate.collapsed}
          onToggleEnabled={() => onToggleRuleEnabled('segregate')}
          onToggleCollapsed={() => onToggleRuleCollapsed('segregate')}
        >
          <TagInput
            tags={segregate.items}
            onAdd={onAddSegregateItem}
            onRemove={onRemoveSegregateItem}
            suggestions={MOCK_CLIENTES_SUGESTOES}
            placeholder="Cliente para segregar..."
          />
        </RuleSection>

        {GROUP_RULE_KEYS.map((ruleKey) => {
          const rule = groupingRules[ruleKey];

          return (
            <RuleSection
              key={ruleKey}
              label={GROUPING_RULE_LABELS[ruleKey]}
              enabled={rule.enabled}
              collapsed={rule.collapsed}
              onToggleEnabled={() => onToggleRuleEnabled(ruleKey)}
              onToggleCollapsed={() => onToggleRuleCollapsed(ruleKey)}
            >
              <div className="space-y-1.5">
                {rule.groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    rule={ruleKey}
                    group={group}
                    onToggleCollapsed={() =>
                      onToggleGroupCollapsed(ruleKey, group.id)
                    }
                    onRemove={() => onRemoveGroup(ruleKey, group.id)}
                    onNameChange={(name) =>
                      onUpdateGroupName(ruleKey, group.id, name)
                    }
                    onAddItem={(item) => onAddGroupItem(ruleKey, group.id, item)}
                    onRemoveItem={(item) =>
                      onRemoveGroupItem(ruleKey, group.id, item)
                    }
                  />
                ))}

                <button
                  type="button"
                  onClick={() => onAddGroup(ruleKey)}
                  className={cn(
                    'flex w-full items-center justify-center gap-1 rounded-md border border-dashed',
                    'border-outline-variant py-1.5 text-[11px] font-medium text-muted-foreground',
                    'transition-colors hover:border-primary hover:text-primary',
                  )}
                >
                  <Plus className="size-3" aria-hidden />
                  Novo grupo
                </button>
              </div>
            </RuleSection>
          );
        })}
      </div>

      <p className="flex items-start gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">
        <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden />
        Agrupamento massivo pode impactar o tempo de checkout.
      </p>
    </div>
  );
}
