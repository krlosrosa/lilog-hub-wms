/**
 * Barrel — re-exports all PostgreSQL schema definitions.
 *
 * Convention: one file per PostgreSQL schema, named [schema-name].schema.ts
 *
 * Current schemas:
 *   audit       → cross-cutting audit trail
 *   auth        → users & funcionarios
 *   master_data → unidades, centros & produtos
 *   armazenagem → unitizadores, demandas & políticas de armazenagem
 *   doca        → docas & operações de doca
 *   recebimento → pré-recebimento, recebimento & conferência
 *   estoque     → endereços, produto_enderecos, movimentações, inventários & contagens
 *   documento   → documentos fiscais
 *   cnc         → cadastro de não conformidade
 *   expedicao   → upload de remessas, transportes e expedição
 *   transporte  → transportadoras e placas
 *   sessao_operacao → equipes, escalas, sessões e presença
 *   operacional     → configurações operacionais genéricas
 *   op_wms          → demandas de separação e gestão de recursos
 *   corte_operacional → solicitações e realização de cortes operacionais
 *   devolucao       → demandas de devolução, notas fiscais e itens
 *   cobranca_transportadora → processos de débito e documentos de cobrança
 *
 * To add a new domain schema:
 *   1. Create config/schemas/[name].schema.ts
 *   2. export * from './[name].schema.js'; below
 *   3. Run: npm run db:generate
 */

export * from './audit.schema.js';
export * from './auth.schema.js';
export * from './master-data.schema.js';
export * from './armazenagem.schema.js';
export * from './doca.schema.js';
export * from './recebimento.schema.js';
export * from './estoque.schema.js';
export * from './documento.schema.js';
export * from './cnc.schema.js';
export * from './expedicao.schema.js';
export * from './expedicao-torre-controle-views.schema.js';
export * from './transporte.schema.js';
export * from './sessao-operacao.schema.js';
export * from './operacional.schema.js';
export * from './op-wms.schema.js';
export * from './corte-operacional.schema.js';
export * from './devolucao.schema.js';
export * from './cobranca-transportadora.schema.js';
