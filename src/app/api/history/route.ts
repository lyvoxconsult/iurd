import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rallyIdParam = searchParams.get('rallyId');
    const type = searchParams.get('type') || 'all'; // all, challenge, leader
    const status = searchParams.get('status') || 'all'; // all, ACTIVE, VOIDED
    const weekNumber = searchParams.get('weekNumber');
    const weekYear = searchParams.get('weekYear');

    let rallyId: string | undefined = rallyIdParam || undefined;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id;
    }

    const challengeWhere: any = {};
    const leaderWhere: any = {};

    if (rallyId) {
      challengeWhere.rallyId = rallyId;
      leaderWhere.rallyId = rallyId;
    }

    if (status !== 'all') {
      challengeWhere.status = status;
      leaderWhere.status = status;
    }

    if (weekNumber && weekYear) {
      const wNum = parseInt(weekNumber, 10);
      const wYear = parseInt(weekYear, 10);
      challengeWhere.weekNumber = wNum;
      challengeWhere.weekYear = wYear;
      leaderWhere.weekNumber = wNum;
      leaderWhere.weekYear = wYear;
    }

    let challengeLaunches: any[] = [];
    let leaderLaunches: any[] = [];

    if (type === 'all' || type === 'challenge') {
      challengeLaunches = await prisma.scoreLaunch.findMany({
        where: challengeWhere,
        orderBy: { scoreDate: 'desc' },
        include: {
          challenge: { select: { id: true, title: true } },
          targetPerson: {
            select: {
              id: true,
              name: true,
              role: true,
              nation: { select: { name: true, color: true } },
              tribe: { select: { name: true } },
            },
          },
        },
      });
    }

    if (type === 'all' || type === 'leader') {
      leaderLaunches = await prisma.leaderScoreLaunch.findMany({
        where: leaderWhere,
        orderBy: { scoreDate: 'desc' },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              role: true,
              nation: { select: { name: true, color: true } },
              tribe: { select: { name: true } },
            },
          },
        },
      });
    }

    // Buscar nomes das nações e tribos para enriquecer os alvos de desafio
    const nations = await prisma.nation.findMany({
      select: { id: true, name: true, color: true },
    });
    const nationsMap = new Map(nations.map((n) => [n.id, n]));

    const tribes = await prisma.tribe.findMany({
      select: { id: true, name: true, nationId: true },
    });
    const tribesMap = new Map(tribes.map((t) => [t.id, t]));

    const formattedChallengeItems = challengeLaunches.map((item) => {
      let targetName = '';
      if (item.targetType === 'nation') {
        targetName = nationsMap.get(item.targetNationId || '')?.name || 'Nação';
      } else if (item.targetType === 'tribe') {
        targetName = tribesMap.get(item.targetTribeId || '')?.name || 'Tribo';
      } else if (item.targetType === 'person') {
        targetName = item.targetPerson?.name || 'Pessoa';
      }

      const snapshotNation = nationsMap.get(item.snapshotNationId);
      const snapshotTribe = item.snapshotTribeId ? tribesMap.get(item.snapshotTribeId) : null;

      return {
        id: item.id,
        type: 'challenge',
        title: item.challenge.title,
        targetType: item.targetType,
        targetName,
        beneficiaryNation: snapshotNation?.name || 'Nação',
        beneficiaryTribe: snapshotTribe?.name || null,
        points: item.points,
        scoreDate: item.scoreDate,
        weekNumber: item.weekNumber,
        weekYear: item.weekYear,
        notes: item.notes,
        status: item.status,
        voidReason: item.voidReason,
        voidedAt: item.voidedAt,
        createdAt: item.createdAt,
      };
    });

    const formattedLeaderItems = leaderLaunches.map((item) => {
      return {
        id: item.id,
        type: 'leader',
        title: `Pontuação Manual de Líder: ${item.reason}`,
        targetType: 'leader',
        targetName: item.leader.name,
        beneficiaryNation: item.leader.nation.name,
        beneficiaryTribe: item.leader.tribe.name,
        leaderRole: item.leaderRole === 'lider_nacao' ? 'Líder de Nação' : 'Líder de Tribo',
        points: item.points,
        reason: item.reason,
        scoreDate: item.scoreDate,
        weekNumber: item.weekNumber,
        weekYear: item.weekYear,
        notes: item.reason,
        status: item.status,
        voidReason: item.voidReason,
        voidedAt: item.voidedAt,
        createdAt: item.createdAt,
      };
    });

    const combinedHistory = [...formattedChallengeItems, ...formattedLeaderItems].sort(
      (a, b) => new Date(b.scoreDate).getTime() - new Date(a.scoreDate).getTime()
    );

    return NextResponse.json({
      history: combinedHistory,
      totalCount: combinedHistory.length,
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }
}
