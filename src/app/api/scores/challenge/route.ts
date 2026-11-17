import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreLaunchSchema } from '@/lib/validations';
import { getWeekInfoForDate } from '@/lib/scoring';
import { createNamedChallengeLaunch } from '@/lib/score-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = scoreLaunchSchema.parse(body);

    const activeRally = await prisma.rally.findFirst({ where: { isActive: true } });
    if (!activeRally) {
      return NextResponse.json({ error: 'Nenhum rali ativo encontrado' }, { status: 400 });
    }

    // Proteção contra reenvio duplicado / clique repetido por Idempotency Key
    if (validated.idempotencyKey) {
      const existing = await prisma.scoreLaunch.findUnique({
        where: { idempotencyKey: validated.idempotencyKey },
      });
      if (existing) {
        if (existing.rallyId !== activeRally.id) {
          return NextResponse.json({ error: 'Chave de lançamento pertence a outro rali' }, { status: 409 });
        }
        return NextResponse.json(
          { success: true, scoreLaunch: existing, duplicateIgnored: true },
          { status: 200 }
        );
      }
    }

    let challenge: any = null;
    if (validated.challengeId) {
      challenge = await prisma.challenge.findFirst({
        where: { id: validated.challengeId, rallyId: activeRally.id, active: true },
      });
    } else if (validated.challengeTitle) {
      // Procura se já foi lançado com esse mesmo nome ou cria dinamicamente
      challenge = await prisma.challenge.findFirst({
        where: {
          rallyId: activeRally.id,
          active: true,
          title: {
            equals: validated.challengeTitle.trim(),
          },
        },
      });

    }

    if (!challenge && (validated.challengeId || !validated.challengeTitle)) {
      return NextResponse.json({ error: 'Desafio não especificado ou não encontrado' }, { status: 404 });
    }
    if (challenge && challenge.defaultPoints !== validated.points) {
      return NextResponse.json({ error: `Este desafio vale ${challenge.defaultPoints} pontos` }, { status: 400 });
    }

    let snapshotNationId: string;
    let snapshotTribeId: string | null = null;
    let targetNationId: string | null = null;
    let targetTribeId: string | null = null;
    let targetPersonId: string | null = null;

    if (validated.targetType === 'nation') {
      const nation = await prisma.nation.findFirst({
        where: { id: validated.targetId, rallyId: activeRally.id },
      });
      if (!nation) {
        return NextResponse.json({ error: 'Nação alvo não encontrada' }, { status: 404 });
      }
      snapshotNationId = nation.id;
      snapshotTribeId = null; // Alvo nação: pontua SOMENTE a nação, nenhuma tribo
      targetNationId = nation.id;
    } else if (validated.targetType === 'tribe') {
      const tribe = await prisma.tribe.findFirst({
        where: { id: validated.targetId, rallyId: activeRally.id },
      });
      if (!tribe) {
        return NextResponse.json({ error: 'Tribo alvo não encontrada' }, { status: 404 });
      }
      snapshotNationId = tribe.nationId; // Pontua a nação correspondente
      snapshotTribeId = tribe.id;       // Pontua a tribo
      targetTribeId = tribe.id;
    } else if (validated.targetType === 'person') {
      const person = await prisma.person.findFirst({
        where: { id: validated.targetId, rallyId: activeRally.id, active: true },
      });
      if (!person) {
        return NextResponse.json({ error: 'Pessoa alvo não encontrada' }, { status: 404 });
      }
      // Snapshot imutável da nação e tribo da pessoa no momento do lançamento
      snapshotNationId = person.nationId;
      snapshotTribeId = person.tribeId;
      targetPersonId = person.id;
      // Regra de negócio: Se a pessoa for líder, o desafio CONTINUA pontuando pessoa (nação e tribo)
      // e NÃO entra no ranking de líderes!
    } else {
      return NextResponse.json({ error: 'Tipo de alvo inválido' }, { status: 400 });
    }

    const dateToUse = validated.scoreDate ? new Date(validated.scoreDate) : new Date();
    const weekInfo = getWeekInfoForDate(dateToUse);

    const launchData = {
        rallyId: activeRally.id,
        targetType: validated.targetType,
        targetNationId,
        targetTribeId,
        targetPersonId,
        snapshotNationId,
        snapshotTribeId,
        points: validated.points, // Valor único, nunca multiplicado por integrantes
        scoreDate: dateToUse,
        weekNumber: weekInfo.weekNumber,
        weekYear: weekInfo.weekYear,
        notes: validated.notes || null,
        idempotencyKey: validated.idempotencyKey || null,
        status: 'ACTIVE',
    };
    const scoreLaunch = challenge
      ? await prisma.scoreLaunch.create({ data: { ...launchData, challengeId: challenge.id } })
      : await createNamedChallengeLaunch(activeRally.id, validated.challengeTitle!.trim(), validated.points, launchData);

    return NextResponse.json({ success: true, scoreLaunch, duplicateIgnored: !!scoreLaunch.duplicateIgnored });
  } catch (error: any) {
    console.error('Erro ao lançar pontuação de desafio:', error);
    return NextResponse.json(
      { error: error.errors?.[0]?.message || error.message || 'Erro ao registrar pontuação' },
      { status: 400 }
    );
  }
}
