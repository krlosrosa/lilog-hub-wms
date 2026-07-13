import type { RecursosSessaoFuncionarioApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

export function withApoioFields(
  operator: Operator,
  funcionario: Partial<
    Pick<RecursosSessaoFuncionarioApi, 'tipoVinculo' | 'equipeOrigemNome'>
  >,
): Operator {
  return {
    ...operator,
    tipoVinculo: funcionario.tipoVinculo ?? 'titular',
    equipeOrigemNome: funcionario.equipeOrigemNome ?? null,
  };
}
