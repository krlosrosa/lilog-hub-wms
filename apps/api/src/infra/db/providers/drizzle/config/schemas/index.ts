/**
 * Barrel — re-exports all PostgreSQL schema definitions.
 *
 * Convention: one file per PostgreSQL schema, named [schema-name].schema.ts
 *
 * Current schemas:
 *   audit       → cross-cutting audit trail
 *   auth        → users & funcionarios
 *   master_data → unidades, centros & produtos
 *   doca        → docas & operações de doca
 *   recebimento → pré-recebimento, recebimento & conferência
 *   documento   → documentos fiscais
 *   cnc         → cadastro de não conformidade
 *   sessao_operacao → equipes, escalas, sessões e presença
 *   configuracoes   → configurações operacionais (produtividade, pausas, parâmetros)
 *
 * To add a new domain schema:
 *   1. Create config/schemas/[name].schema.ts
 *   2. export * from './[name].schema.js'; below
 *   3. Run: npm run db:generate
 */

export * from './audit.schema.js';
export * from './auth.schema.js';
export * from './master-data.schema.js';
export * from './doca.schema.js';
export * from './recebimento.schema.js';
export * from './recebimento-detalhe-view.schema.js';
export * from './documento.schema.js';
export * from './cnc.schema.js';
export * from './sessao-operacao.schema.js';
export * from './configuracoes.schema.js';
export * from './sync.schema.js';
export * from './replicache.schema.js';
