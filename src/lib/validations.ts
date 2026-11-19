import { z } from 'zod';

export const CategoryEnum = z.enum(['jovem', 'membro', 'obreiro', 'colaborador']);
export const RoleEnum = z.enum(['participante', 'lider_tribo', 'lider_nacao']);
export const TargetTypeEnum = z.enum(['nation', 'tribe', 'person']);

export const personSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  nationId: z.string().min(1, 'Selecione uma nação'),
  tribeId: z.string().min(1, 'Selecione uma tribo'),
  category: CategoryEnum,
  role: RoleEnum,
  active: z.boolean().optional(),
});

export const challengeSchema = z.object({
  title: z.string().trim().min(3, 'O título deve ter no mínimo 3 caracteres'),
  description: z.string().trim().optional(),
  defaultPoints: z.coerce.number().int().positive('Os pontos devem ser um número inteiro positivo'),
});

export const scoreLaunchSchema = z
  .object({
    challengeId: z.string().nullable().optional(),
    challengeTitle: z.string().trim().min(2, 'Informe o nome do desafio').nullable().optional(),
    targetType: TargetTypeEnum,
    targetId: z.string().min(1, 'Alvo da pontuação é obrigatório'),
    points: z.coerce.number().int().positive('Os pontos devem ser um número inteiro positivo'),
    scoreDate: z.string().datetime({ offset: true }).nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    idempotencyKey: z.string().nullable().optional(),
  })
  .refine((data) => !!data.challengeId || !!data.challengeTitle, {
    message: 'Escreva o nome do desafio',
    path: ['challengeTitle'],
  });

export const leaderScoreLaunchSchema = z.object({
  leaderId: z.string().min(1, 'Líder é obrigatório'),
  points: z.coerce.number().int().positive('A quantidade de pontos deve ser um número inteiro positivo'),
  reason: z.string().trim().min(3, 'O motivo do lançamento é obrigatório (mínimo 3 caracteres)'),
  scoreDate: z.string().datetime({ offset: true }).nullable().optional(),
  idempotencyKey: z.string().nullable().optional(),
});

export const voidScoreSchema = z.object({
  launchType: z.enum(['challenge', 'leader']),
  launchId: z.string().min(1, 'ID do lançamento é obrigatório'),
  reason: z.string().trim().min(3, 'O motivo da anulação/estorno é obrigatório'),
});
