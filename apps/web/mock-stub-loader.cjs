/**
 * Stubs mock modules in production builds to avoid shipping large dev datasets.
 */
module.exports = function mockStubLoader(source) {
  const isProduction =
    this.mode === 'production' || process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return source;
  }

  const lines = [];
  const exportConstRegex = /export const ([A-Z0-9_]+)/g;
  const exportFunctionRegex = /export (?:async )?function ([A-Za-z0-9_]+)/g;
  const exportedConsts = new Set();
  const exportedFunctions = new Set();

  let match = exportConstRegex.exec(source);
  while (match) {
    exportedConsts.add(match[1]);
    match = exportConstRegex.exec(source);
  }

  match = exportFunctionRegex.exec(source);
  while (match) {
    exportedFunctions.add(match[1]);
    match = exportFunctionRegex.exec(source);
  }

  function extractConstExport(name) {
    const extracted = source.match(
      new RegExp(`export const ${name}[\\s\\S]*?=([\\s\\S]*?);\\n`),
    );

    return extracted ? `export const ${name} = ${extracted[1]};` : null;
  }

  function isObjectMock(name) {
    return (
      name.endsWith('_STATS') ||
      name.endsWith('_SUMMARY') ||
      name.endsWith('_KPIS') ||
      name.endsWith('_DETALHE') ||
      name.endsWith('_DETALHES') ||
      name.endsWith('_CONFIG') ||
      name.endsWith('_NOTA') ||
      name.endsWith('_SNAPSHOT') ||
      name.endsWith('_STATUS') ||
      name.endsWith('_RESUMO') ||
      name.endsWith('_METRICAS') ||
      name.endsWith('_HEADER') ||
      name.endsWith('_REGISTROS') ||
      name.endsWith('_REGISTRO') ||
      name.endsWith('_INFO') ||
      name.endsWith('_AUDITORIA') ||
      name.endsWith('_INDICADORES') ||
      name.endsWith('_MAP') ||
      name.endsWith('_STORE') ||
      name.endsWith('_FOOTER_KPI') ||
      name.endsWith('_PRONTOS') ||
      name.endsWith('_OPERADORES') ||
      name.endsWith('_TAG')
    );
  }

  function shouldPassthroughConst(name) {
    return (
      name.startsWith('DEFAULT_') ||
      name.endsWith('_OPCOES') ||
      name.endsWith('_PADRAO') ||
      name === 'CENTRO_OPCOES' ||
      name === 'GALPAO_OPCOES' ||
      name === 'ENDERECO_TAG' ||
      name === 'AGENDA_DIA_HOJE' ||
      name === 'CALENDAR_WEEKDAYS' ||
      name === 'MOCK_ESTIMATED_EXECUTION_MINUTES' ||
      name === 'MOCK_REPLENISHMENT_TOTAL' ||
      name === 'CONFIG_DISTRIBUICAO_PADRAO' ||
      name === 'NIVEIS_OPCOES' ||
      name === 'NIVEL_IMPRESSAO_OPCOES' ||
      name === 'ZONA_FILTRO_OPCOES' ||
      name === 'STATUS_FILTRO_TONE'
    );
  }

  function isMockConst(name) {
    return name.startsWith('MOCK_') || name.endsWith('_MOCK');
  }

  for (const name of exportedConsts) {
    if (isMockConst(name)) {
      lines.push(
        `export const ${name} = ${isObjectMock(name) ? '{}' : '[]'};`,
      );
      continue;
    }

    if (shouldPassthroughConst(name)) {
      const extracted = extractConstExport(name);
      if (extracted) {
        lines.push(extracted);
      }
      continue;
    }

    lines.push(`export const ${name} = ${isObjectMock(name) ? '{}' : '[]'};`);
  }

  for (const name of exportedFunctions) {
    const returnsCollection =
      /^build/i.test(name) ||
      /^listar/i.test(name) ||
      /^getDemandasMockStore/i.test(name);

    const returnsObject =
      /^calcular/i.test(name) ||
      /^clone/i.test(name) ||
      /^montar/i.test(name) ||
      /^resolver/i.test(name);

    if (returnsCollection) {
      lines.push(`export function ${name}(..._args) { return []; }`);
      continue;
    }

    if (returnsObject) {
      lines.push(`export function ${name}(..._args) { return {}; }`);
      continue;
    }

    lines.push(`export function ${name}(..._args) { return undefined; }`);
  }

  if (lines.length === 0) {
    return 'export {};';
  }

  return `${lines.join('\n')}\n`;
};
