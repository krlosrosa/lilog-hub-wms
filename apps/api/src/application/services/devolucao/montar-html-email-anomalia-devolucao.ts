export type AvariaEmailInput = {
  tipo: string;
  itemSku: string | null;
  natureza: string | null;
  causa: string | null;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  observacao: string | null;
  photoUrls: string[];
};

export type FaltaPesoEmailInput = {
  sku: string;
  descricaoProduto: string | null;
  pesoEsperadoKg: number;
  pesoDevolvidoKg: number;
  pesoFaltanteKg: number;
  quantidadeContabilConsiderada: number;
  motivo: string | null;
  observacao: string | null;
};

export type MontarHtmlEmailAnomaliaDevolucaoInput = {
  codigoDemanda: string;
  transportadoraNome: string | null;
  placa: string | null;
  transporteId: string | null;
  avarias: AvariaEmailInput[];
  faltasPeso: FaltaPesoEmailInput[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function renderPhotoLinks(photoUrls: string[]): string {
  if (photoUrls.length === 0) {
    return '<span style="color:#6b7280;">Sem fotos</span>';
  }

  return photoUrls
    .map(
      (url, index) =>
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">Foto ${index + 1}</a>`,
    )
    .join(' &middot; ');
}

function renderAvariasTable(avarias: AvariaEmailInput[]): string {
  if (avarias.length === 0) {
    return '';
  }

  const rows = avarias
    .map(
      (avaria) => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(avaria.tipo)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(avaria.itemSku ?? avaria.tipo)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(avaria.natureza ?? '-')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(avaria.causa ?? '-')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${formatNumber(avaria.quantidadeCaixa)} cx / ${formatNumber(avaria.quantidadeUnidade)} un</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(avaria.observacao ?? '-')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${renderPhotoLinks(avaria.photoUrls)}</td>
        </tr>`,
    )
    .join('');

  return `
    <h2 style="margin:24px 0 12px;font-size:18px;color:#111827;">Avarias registradas</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Tipo</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">SKU</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Natureza</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Causa</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Quantidade</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Observação</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Fotos</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderFaltasPesoTable(faltasPeso: FaltaPesoEmailInput[]): string {
  if (faltasPeso.length === 0) {
    return '';
  }

  const rows = faltasPeso
    .map(
      (falta) => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(falta.sku)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(falta.descricaoProduto ?? '-')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${formatNumber(falta.pesoEsperadoKg)} kg</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${formatNumber(falta.pesoDevolvidoKg)} kg</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${formatNumber(falta.pesoFaltanteKg)} kg</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${formatNumber(falta.quantidadeContabilConsiderada)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(falta.motivo ?? 'Falta de peso')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(falta.observacao ?? '-')}</td>
        </tr>`,
    )
    .join('');

  return `
    <h2 style="margin:24px 0 12px;font-size:18px;color:#111827;">Faltas de peso validadas</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">SKU</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Produto</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Peso esperado</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Peso devolvido</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Peso faltante</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Qtd. contábil</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Motivo</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Observação</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function montarHtmlEmailAnomaliaDevolucao(
  input: MontarHtmlEmailAnomaliaDevolucaoInput,
): string {
  const transportadoraLabel = input.transportadoraNome
    ? escapeHtml(input.transportadoraNome)
    : 'Transportadora não identificada';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:960px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 8px;font-size:24px;">Ocorrência na devolução ${escapeHtml(input.codigoDemanda)}</h1>
      <p style="margin:0 0 16px;color:#4b5563;">
        A demanda de devolução foi finalizada com anomalias registradas no processo.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px;">
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;width:180px;"><strong>Demanda</strong></td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.codigoDemanda)}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Transportadora</strong></td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${transportadoraLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Transporte</strong></td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.transporteId ?? '-')}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Placa</strong></td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.placa ?? '-')}</td>
        </tr>
      </table>

      ${renderAvariasTable(input.avarias)}
      ${renderFaltasPesoTable(input.faltasPeso)}

      <p style="margin:24px 0 0;color:#6b7280;font-size:12px;">
        Os links de fotos expiram em 1 hora. Este e-mail foi gerado automaticamente pelo sistema de devoluções.
      </p>
    </div>
  </body>
</html>`;
}

export function montarTextoEmailAnomaliaDevolucao(
  input: MontarHtmlEmailAnomaliaDevolucaoInput,
): string {
  const lines = [
    `Ocorrência na devolução ${input.codigoDemanda}`,
    '',
    `Transportadora: ${input.transportadoraNome ?? 'Não identificada'}`,
    `Transporte: ${input.transporteId ?? '-'}`,
    `Placa: ${input.placa ?? '-'}`,
    '',
  ];

  if (input.avarias.length > 0) {
    lines.push('Avarias registradas:');
    for (const avaria of input.avarias) {
      lines.push(
        `- ${avaria.tipo} | SKU ${avaria.itemSku ?? '-'} | ${avaria.quantidadeCaixa} cx / ${avaria.quantidadeUnidade} un`,
      );
      if (avaria.photoUrls.length > 0) {
        lines.push(`  Fotos: ${avaria.photoUrls.join(', ')}`);
      }
    }
    lines.push('');
  }

  if (input.faltasPeso.length > 0) {
    lines.push('Faltas de peso validadas:');
    for (const falta of input.faltasPeso) {
      lines.push(
        `- SKU ${falta.sku} | faltante ${falta.pesoFaltanteKg} kg | qtd. ${falta.quantidadeContabilConsiderada}`,
      );
    }
  }

  return lines.join('\n');
}
