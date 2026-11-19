import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekInfo, getWeekInfoForDate, applyRankingWithTies } from '@/lib/scoring';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rallyIdParam = searchParams.get('rallyId');
    const period = searchParams.get('period') || 'week'; // 'week' | 'total'
    const weekNumberParam = searchParams.get('weekNumber');
    const weekYearParam = searchParams.get('weekYear');

    let rallyId = rallyIdParam;
    if (!rallyId) {
      const active = await prisma.rally.findFirst({ where: { isActive: true } });
      rallyId = active?.id || null;
    }

    if (!rallyId) {
      return NextResponse.json({
        error: 'Nenhum rali ativo encontrado',
        nations: [],
        tribes: [],
        tribeLeaders: [],
        nationLeaders: [],
      });
    }

    const currentWeekInfo = getCurrentWeekInfo();
    const targetWeekNumber = weekNumberParam ? parseInt(weekNumberParam, 10) : currentWeekInfo.weekNumber;
    const targetWeekYear = weekYearParam ? parseInt(weekYearParam, 10) : currentWeekInfo.weekYear;

    // Condição de semana para filtros
    const weekWhere: any = {
      rallyId,
      status: 'ACTIVE',
    };
    if (period === 'week') {
      weekWhere.weekNumber = targetWeekNumber;
      weekWhere.weekYear = targetWeekYear;
    }

    // 1. Carregar Nações e calcular pontos
    const nations = await prisma.nation.findMany({
      where: { rallyId },
      orderBy: { orderIndex: 'asc' },
    });

    // Buscar lançamentos de desafio ativos
    const challengeLaunches = await prisma.scoreLaunch.findMany({
      where: weekWhere,
    });

    // Pontos acumulados de cada nação
    const nationScores = nations.map((nation) => {
      const points = challengeLaunches
        .filter((l) => l.snapshotNationId === nation.id)
        .reduce((sum, l) => sum + l.points, 0);

      return {
        item: nation,
        points,
      };
    });

    const rankedNations = applyRankingWithTies(nationScores);

    // 2. Carregar Tribos e calcular pontos
    const tribes = await prisma.tribe.findMany({
      where: { rallyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        nation: { select: { id: true, name: true, color: true } },
      },
    });

    const tribeScores = tribes.map((tribe) => {
      const points = challengeLaunches
        .filter((l) => l.snapshotTribeId === tribe.id)
        .reduce((sum, l) => sum + l.points, 0);

      return {
        item: tribe,
        points,
      };
    });

    const rankedTribes = applyRankingWithTies(tribeScores);

    // 3. Buscar lançamentos de líder ativos
    const leaderWhere: any = {
      rallyId,
      status: 'ACTIVE',
    };
    if (period === 'week') {
      leaderWhere.weekNumber = targetWeekNumber;
      leaderWhere.weekYear = targetWeekYear;
    }

    const leaderLaunches = await prisma.leaderScoreLaunch.findMany({
      where: leaderWhere,
    });

    // 4. Ranking de Líderes de Tribo
    const leaderIdsWithScores = new Set(leaderLaunches.map((l: any) => l.leaderId));

    const allTribeLeaders = await prisma.person.findMany({
      where: {
        rallyId,
        role: 'lider_tribo',
      },
      include: {
        nation: { select: { name: true, color: true } },
        tribe: { select: { name: true } },
      },
    });
    // Considera líderes ativos OU líderes que possuem pontuação no período consultado
    const tribeLeaders = allTribeLeaders.filter(
      (leader) => leader.active || leaderIdsWithScores.has(leader.id)
    );

    const tribeLeaderScores = tribeLeaders.map((leader) => {
      const points = leaderLaunches
        .filter((l) => l.leaderId === leader.id && l.leaderRole === 'lider_tribo')
        .reduce((sum, l) => sum + l.points, 0);

      return {
        item: leader,
        points,
      };
    });

    const rankedTribeLeaders = applyRankingWithTies(tribeLeaderScores);

    // 5. Ranking de Líderes de Nação
    const allNationLeaders = await prisma.person.findMany({
      where: {
        rallyId,
        role: 'lider_nacao',
      },
      include: {
        nation: { select: { name: true, color: true } },
        tribe: { select: { name: true } },
      },
    });
    // Considera líderes de nação ativos OU que possuem pontuação no período consultado
    const nationLeaders = allNationLeaders.filter(
      (leader) => leader.active || leaderIdsWithScores.has(leader.id)
    );

    const nationLeaderScores = nationLeaders.map((leader) => {
      const points = leaderLaunches
        .filter((l) => l.leaderId === leader.id && l.leaderRole === 'lider_nacao')
        .reduce((sum, l) => sum + l.points, 0);

      return {
        item: leader,
        points,
      };
    });

    const rankedNationLeaders = applyRankingWithTies(nationLeaderScores);

    // Buscar lista de semanas disponíveis no rali para o seletor
    const availableWeeksFromChallenges = await prisma.scoreLaunch.findMany({
      where: { rallyId },
      select: { weekNumber: true, weekYear: true },
      distinct: ['weekNumber', 'weekYear'],
    });

    const availableWeeksFromLeaders = await prisma.leaderScoreLaunch.findMany({
      where: { rallyId },
      select: { weekNumber: true, weekYear: true },
      distinct: ['weekNumber', 'weekYear'],
    });

    const weeksMap = new Map<string, { weekNumber: number; weekYear: number }>();
    // Sempre incluir semana atual
    weeksMap.set(`${currentWeekInfo.weekYear}-${currentWeekInfo.weekNumber}`, {
      weekNumber: currentWeekInfo.weekNumber,
      weekYear: currentWeekInfo.weekYear,
    });
    for (const w of [...availableWeeksFromChallenges, ...availableWeeksFromLeaders]) {
      weeksMap.set(`${w.weekYear}-${w.weekNumber}`, {
        weekNumber: w.weekNumber,
        weekYear: w.weekYear,
      });
    }

    const availableWeeks = Array.from(weeksMap.values()).sort((a, b) => {
      if (a.weekYear !== b.weekYear) return b.weekYear - a.weekYear;
      return b.weekNumber - a.weekNumber;
    });

    return NextResponse.json({
      period,
      targetWeek: {
        weekNumber: targetWeekNumber,
        weekYear: targetWeekYear,
        isPartial: targetWeekYear > currentWeekInfo.weekYear ||
          (targetWeekYear === currentWeekInfo.weekYear && targetWeekNumber >= currentWeekInfo.weekNumber),
      },
      currentWeekInfo,
      availableWeeks,
      nations: rankedNations,
      tribes: rankedTribes,
      tribeLeaders: rankedTribeLeaders,
      nationLeaders: rankedNationLeaders,
    });
  } catch (error) {
    console.error('Erro ao calcular rankings:', error);
    return NextResponse.json({ error: 'Erro ao calcular rankings' }, { status: 500 });
  }
}
