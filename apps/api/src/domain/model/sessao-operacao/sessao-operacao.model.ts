import { z } from 'zod';

export const HorarioEscalaSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, 'Horário inválido');

export type HorarioEscala = z.infer<typeof HorarioEscalaSchema>;

export const CreateEscalaInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nomeEscala: z.string().min(1).max(100),
  horaInicio: HorarioEscalaSchema,
  horaFim: HorarioEscalaSchema,
  nomeEquipe: z.string().min(1).max(100),
  area: z.string().max(50).optional(),
});

export type CreateEscalaInput = z.infer<typeof CreateEscalaInputSchema>;

export const SessaoTrabalhoStatusSchema = z.enum([
  'planejada',
  'aberta',
  'encerrada',
  'cancelada',
]);

export type SessaoTrabalhoStatus = z.infer<typeof SessaoTrabalhoStatusSchema>;

export const SessaoPresencaStatusSchema = z.enum([
  'esperado',
  'presente',
  'falta',
  'atestado',
  'folga',
  'atraso',
]);

export type SessaoPresencaStatus = z.infer<typeof SessaoPresencaStatusSchema>;

export const CreateSessaoInputSchema = z.object({
  escalaId: z.uuid(),
  dataReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
});

export type CreateSessaoInput = z.infer<typeof CreateSessaoInputSchema>;

export const UpdateSessaoFuncionarioPresencaInputSchema = z.object({
  status: SessaoPresencaStatusSchema.optional(),
  checkIn: z.iso.datetime().nullable().optional(),
  checkOut: z.iso.datetime().nullable().optional(),
  observacao: z.string().max(500).nullable().optional(),
});

export type UpdateSessaoFuncionarioPresencaInput = z.infer<
  typeof UpdateSessaoFuncionarioPresencaInputSchema
>;

export const SessaoPausaTipoSchema = z.enum(['termica', 'refeicao', 'outros']);

export type SessaoPausaTipo = z.infer<typeof SessaoPausaTipoSchema>;

export const IniciarSessaoPausaInputSchema = z.object({
  tipo: SessaoPausaTipoSchema,
  observacao: z.string().max(500).optional(),
});

export type IniciarSessaoPausaInput = z.infer<
  typeof IniciarSessaoPausaInputSchema
>;

export const SessaoVinculoTipoSchema = z.enum(['titular', 'apoio']);

export type SessaoVinculoTipo = z.infer<typeof SessaoVinculoTipoSchema>;

export const AdicionarFuncionarioApoioInputSchema = z.object({
  funcionarioId: z.number().int().positive(),
});

export type AdicionarFuncionarioApoioInput = z.infer<
  typeof AdicionarFuncionarioApoioInputSchema
>;
