import type { SessaoRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

type SessaoRow = {
  id: string;
  unidadeId: string;
  escalaId: string;
  equipeId: string;
  dataReferencia: string;
  inicioPlanejado: Date;
  fimPlanejado: Date;
  inicioReal: Date | null;
  fimReal: Date | null;
  status: 'planejada' | 'aberta' | 'encerrada' | 'cancelada';
  escalaNome: string;
  equipeNome: string;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  totalFuncionarios: number;
  abertaPorUserId: number | null;
  encerradaPorUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function formatHorario(value: string): string {
  return value.slice(0, 5);
}

export function mapSessaoRow(row: SessaoRow): SessaoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    escalaId: row.escalaId,
    equipeId: row.equipeId,
    dataReferencia: row.dataReferencia,
    inicioPlanejado: row.inicioPlanejado,
    fimPlanejado: row.fimPlanejado,
    inicioReal: row.inicioReal,
    fimReal: row.fimReal,
    status: row.status,
    escalaNome: row.escalaNome,
    equipeNome: row.equipeNome,
    horaInicioPlanejada: formatHorario(row.horaInicioPlanejada),
    horaFimPlanejada: formatHorario(row.horaFimPlanejada),
    cruzaMeiaNoite: row.cruzaMeiaNoite,
    totalFuncionarios: Number(row.totalFuncionarios),
    abertaPorUserId: row.abertaPorUserId,
    encerradaPorUserId: row.encerradaPorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
