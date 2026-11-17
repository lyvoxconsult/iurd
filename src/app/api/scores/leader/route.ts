import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { leaderScoreLaunchSchema } from '@/lib/validations';
import { getWeekInfoForDate } from '@/lib/scoring';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = leaderScoreLaunchSchema.parse(body);

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) {
      return NextResponse.json({ error: 'Nenhum rali ativo encontrado' }, { status: 400 });
    }

    // Proteção contra reenvio duplicado / clique repetido por Idempotency Key
    if (validated.idempotencyKey) {
      const existing = await prisma.leaderScoreLaunch.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
      });
      if (existing) {
        if (existing.rallyId !== activeRally.id) {
          return NextResponse.json({ error: 'Chave de lançamento pertence a outro rali' }, { status: 409 });
        }
        return NextResponse.json(
          { success: true, leaderScoreLaunch: existing, duplicateIgnored: true },
          { status: 200 }
        );
      }
    }

    const leader = await prisma.person.findFirst({
      where: { id: validated.leaderId, rallyId: activeRally.id, active: true },
      include: {
        nation: { select: { name: true } },
        tribe: { select: { name: true } },
      },
    });

    if (!leader) {
      return NextResponse.json({ error: 'Líder não encontrado' }, { status: 404 });
    }

    // Regra estrita: O integrante DEVE ter função de líder
    if (leader.role !== 'lider_tribo' && leader.role !== 'lider_nacao') {
      return NextResponse.json(
        { error: 'A pessoa selecionada não possui função de liderança (deve ser Líder de Tribo ou Líder de Nação).' },
        { status: 400 }
      );
    }

    const dateToUse = validated.scoreDate ? new Date(validated.scoreDate) : new Date();
    const weekInfo = getWeekInfoForDate(dateToUse);

    // Salva pontuação manual do líder.
    // REGRA DE OURO: Esse lançamento entra SOMENTE no ranking do tipo do líder.
    // NUNCA altera o placar da tribo ou da nação!
    const leaderScore = await prisma.leaderScoreLaunch.create({
      data: {
        rallyId: activeRally.id,
        leaderId: leader.id,
        leaderRole: leader.role, // Snapshot imutável da função
        points: validated.points,
        reason: validated.reason,
        scoreDate: dateToUse,
        weekNumber: weekInfo.weekNumber,
        weekYear: weekInfo.weekYear,
        idempotencyKey: validated.idempotencyKey || null,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, leaderScore });
  } catch (error: any) {
    console.error('Erro ao lançar pontos de líder:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao registrar pontos de líder' },
      { status: 400 }
    );
  }
}
