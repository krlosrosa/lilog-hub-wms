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
  const exportedNames = new Set();

  for (const regex of [exportConstRegex, exportFunctionRegex]) {
    let match = regex.exec(source);
    while (match) {
      exportedNames.add(match[1]);
      match = regex.exec(source);
    }
  }

  function extractConstExport(name) {
    const match = source.match(
      new RegExp(`export const ${name}[\\s\\S]*?=([\\s\\S]*?);\\n`),
    );

    return match ? `export const ${name} = ${match[1]};` : null;
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
      name.endsWith('_TAG') ||
      name.endsWith('_METRICAS')
    );
  }

  for (const name of exportedNames) {
    if (name.startsWith('MOCK_')) {
      lines.push(
        `export const ${name} = ${isObjectMock(name) ? '{}' : '[]'};`,
      );
      continue;
    }

    if (
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
    ) {
      const extracted = extractConstExport(name);
      if (extracted) {
        lines.push(extracted);
      }
      continue;
    }

    if (/^(get|buscar|listar|calcular|resolver|criar|add|remove|clone|montar|filtrar)/i.test(name)) {
      lines.push(
        `export function ${name}(..._args: unknown[]) { return undefined; }`,
      );
    }
  }

  if (lines.length === 0) {
    return 'export {};';
  }

  return `${lines.join('\n')}\n`;
};
