import type {
  EscalaDetailRecord,
  EscalaRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

type EscalaRow = {
  id: string;
  unidadeId: string;
  equipeId: string;
  nome: string;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  equipeNome: string;
  equipeArea: string | null;
  totalFuncionarios: number;
};

function formatHorario(value: string): string {
  return value.slice(0, 5);
}

export function mapEscalaRow(row: EscalaRow): EscalaRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    equipeId: row.equipeId,
    nome: row.nome,
    horaInicioPlanejada: formatHorario(row.horaInicioPlanejada),
    horaFimPlanejada: formatHorario(row.horaFimPlanejada),
    cruzaMeiaNoite: row.cruzaMeiaNoite,
    ativo: row.ativo,
    equipeNome: row.equipeNome,
    equipeArea: row.equipeArea,
    totalFuncionarios: Number(row.totalFuncionarios),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapEscalaDetailRow(row: EscalaRow): EscalaDetailRecord {
  return mapEscalaRow(row);
}
