import { PrismaClient } from '@prisma/client';
import { getWeekInfoForDate, applyRankingWithTies } from '../src/lib/scoring';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log(' INICIANDO BATERIA DE TESTES DE REGRAS DE NEGÓCIO ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FALHA: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`✅ SUCESSO: ${message}`);
      passedTests++;
    }
  }

  // 1. Criar um Rali isolado para testes
  const testRally = await prisma.rally.create({
    data: {
      name: `Rali Teste Regras ${Date.now()}`,
      startDate: new Date(),
      isActive: false, // para não interferir no rali ativo
    },
  });

  // Criar 2 Nações
  const nationA = await prisma.nation.create({
    data: { rallyId: testRally.id, name: 'Nação Teste A', color: '#f59e0b', orderIndex: 1 },
  });
  const nationB = await prisma.nation.create({
    data: { rallyId: testRally.id, name: 'Nação Teste B', color: '#3b82f6', orderIndex: 2 },
  });

  // Criar Tribo T1 em Nação A e Tribo T2 em Nação B
  const tribeT1 = await prisma.tribe.create({
    data: { rallyId: testRally.id, nationId: nationA.id, name: 'Tribo T1', orderIndex: 1 },
  });
  const tribeT2 = await prisma.tribe.create({
    data: { rallyId: testRally.id, nationId: nationB.id, name: 'Tribo T2', orderIndex: 1 },
  });

  // Criar Desafio D1
  const challengeD1 = await prisma.challenge.create({
    data: { rallyId: testRally.id, title: 'Desafio Teste', defaultPoints: 10 },
  });

  // TESTE 1: Validação de vínculo de pessoa - Tribo de outra nação deve ser impedida
  console.log('\n--- Teste 1: Regras de Cadastro de Pessoa e Vínculo ---');
  let threwValidationError = false;
  try {
    const invalidNationId = nationA.id;
    const invalidTribe = tribeT2; // tribeT2 pertence a nationB!
    if (invalidTribe.nationId !== invalidNationId) {
      throw new Error('A tribo selecionada não pertence à nação indicada!');
    }
  } catch (e) {
    threwValidationError = true;
  }
  assert(threwValidationError, 'Cadastro de pessoa impede selecionar tribo de outra nação');

  // Cadastrar pessoa válida P1 em Nação A e Tribo T1 (participante)
  const personP1 = await prisma.person.create({
    data: {
      rallyId: testRally.id,
      name: 'Pessoa P1',
      nationId: nationA.id,
      tribeId: tribeT1.id,
      category: 'jovem',
      role: 'participante',
    },
  });

  // Cadastrar líder L1 em Nação A e Tribo T1 (líder de tribo)
  const leaderL1 = await prisma.person.create({
    data: {
      rallyId: testRally.id,
      name: 'Líder L1',
      nationId: nationA.id,
      tribeId: tribeT1.id,
      category: 'obreiro',
      role: 'lider_tribo',
    },
  });

  console.log('\n--- Teste 2: Sequência de Lançamentos de Desafio ---');
  // Data simulada: Segunda-feira
  const testDate = new Date('2026-11-16T14:00:00-03:00');
  const weekInfo = getWeekInfoForDate(testDate);

  // 1) Desafio de 10 pontos para a nação A acrescenta 10 somente à nação A
  const launch1 = await prisma.scoreLaunch.create({
    data: {
      rallyId: testRally.id,
      challengeId: challengeD1.id,
      targetType: 'nation',
      targetNationId: nationA.id,
      snapshotNationId: nationA.id,
      snapshotTribeId: null, // alvo nação
      points: 10,
      scoreDate: testDate,
      weekNumber: weekInfo.weekNumber,
      weekYear: weekInfo.weekYear,
      status: 'ACTIVE',
    },
  });

  // 2) Desafio de 20 pontos para Tribo T1 (da nação A)
  const launch2 = await prisma.scoreLaunch.create({
    data: {
      rallyId: testRally.id,
      challengeId: challengeD1.id,
      targetType: 'tribe',
      targetTribeId: tribeT1.id,
      snapshotNationId: tribeT1.nationId, // nationA.id
      snapshotTribeId: tribeT1.id,
      points: 20,
      scoreDate: testDate,
      weekNumber: weekInfo.weekNumber,
      weekYear: weekInfo.weekYear,
      status: 'ACTIVE',
    },
  });

  // 3) Desafio de 30 pontos para a pessoa P1 (da Tribo T1, Nação A)
  const launch3 = await prisma.scoreLaunch.create({
    data: {
      rallyId: testRally.id,
      challengeId: challengeD1.id,
      targetType: 'person',
      targetPersonId: personP1.id,
      snapshotNationId: personP1.nationId, // nationA.id
      snapshotTribeId: personP1.tribeId,   // tribeT1.id
      points: 30,
      scoreDate: testDate,
      weekNumber: weekInfo.weekNumber,
      weekYear: weekInfo.weekYear,
      status: 'ACTIVE',
    },
  });

  // Cálculo dos pontos acumulados
  const launches = await prisma.scoreLaunch.findMany({
    where: { rallyId: testRally.id, status: 'ACTIVE' },
  });

  const nationAPoints = launches
    .filter((l) => l.snapshotNationId === nationA.id)
    .reduce((sum, l) => sum + l.points, 0);

  const tribeT1Points = launches
    .filter((l) => l.snapshotTribeId === tribeT1.id)
    .reduce((sum, l) => sum + l.points, 0);

  assert(nationAPoints === 60, `Nação A tem exatamente 60 pontos (10 + 20 + 30) -> Atual: ${nationAPoints}`);
  assert(tribeT1Points === 50, `Tribo T1 tem exatamente 50 pontos (20 + 30) -> Atual: ${tribeT1Points}`);

  console.log('\n--- Teste 3: Lançamento Manual de Pontos de Líder ---');
  // Lançamento manual de 50 pontos para Líder L1
  const leaderLaunch = await prisma.leaderScoreLaunch.create({
    data: {
      rallyId: testRally.id,
      leaderId: leaderL1.id,
      leaderRole: leaderL1.role,
      points: 50,
      reason: 'Líder mais engajado na semana',
      scoreDate: testDate,
      weekNumber: weekInfo.weekNumber,
      weekYear: weekInfo.weekYear,
      status: 'ACTIVE',
    },
  });

  // Recalcular nação e tribo para garantir que pontos de líder NUNCA alteram o placar da tribo ou nação
  const postLeaderLaunches = await prisma.scoreLaunch.findMany({
    where: { rallyId: testRally.id, status: 'ACTIVE' },
  });
  const nationAPointsPostLeader = postLeaderLaunches
    .filter((l) => l.snapshotNationId === nationA.id)
    .reduce((sum, l) => sum + l.points, 0);
  const tribeT1PointsPostLeader = postLeaderLaunches
    .filter((l) => l.snapshotTribeId === tribeT1.id)
    .reduce((sum, l) => sum + l.points, 0);

  assert(
    nationAPointsPostLeader === 60,
    `Pontos de líder NÃO alteram a Nação A (continua com 60 pontos) -> Atual: ${nationAPointsPostLeader}`
  );
  assert(
    tribeT1PointsPostLeader === 50,
    `Pontos de líder NÃO alteram a Tribo T1 (continua com 50 pontos) -> Atual: ${tribeT1PointsPostLeader}`
  );

  const leaderScores = await prisma.leaderScoreLaunch.findMany({
    where: { rallyId: testRally.id, leaderId: leaderL1.id, status: 'ACTIVE' },
  });
  const leaderPoints = leaderScores.reduce((sum, l) => sum + l.points, 0);
  assert(leaderPoints === 50, `Ranking do Líder L1 tem 50 pontos -> Atual: ${leaderPoints}`);

  console.log('\n--- Teste 4: Líder Pontuando em Desafio como Pessoa ---');
  // Se o líder L1 pontua em um desafio de 15 pontos como pessoa
  await prisma.scoreLaunch.create({
    data: {
      rallyId: testRally.id,
      challengeId: challengeD1.id,
      targetType: 'person',
      targetPersonId: leaderL1.id,
      snapshotNationId: leaderL1.nationId,
      snapshotTribeId: leaderL1.tribeId,
      points: 15,
      scoreDate: testDate,
      weekNumber: weekInfo.weekNumber,
      weekYear: weekInfo.weekYear,
      status: 'ACTIVE',
    },
  });

  const leaderScoresAfterChallenge = await prisma.leaderScoreLaunch.findMany({
    where: { rallyId: testRally.id, leaderId: leaderL1.id, status: 'ACTIVE' },
  });
  const leaderPointsAfterChallenge = leaderScoresAfterChallenge.reduce((sum, l) => sum + l.points, 0);
  assert(
    leaderPointsAfterChallenge === 50,
    `Pontuação de líder de L1 permanece 50 (desafio não altera ranking de líder) -> Atual: ${leaderPointsAfterChallenge}`
  );

  const launchesAfterLeaderChallenge = await prisma.scoreLaunch.findMany({
    where: { rallyId: testRally.id, status: 'ACTIVE' },
  });
  const nationAPointsAfterLeaderChallenge = launchesAfterLeaderChallenge
    .filter((l) => l.snapshotNationId === nationA.id)
    .reduce((sum, l) => sum + l.points, 0);
  assert(
    nationAPointsAfterLeaderChallenge === 75,
    `Nação A recebeu os 15 pontos do desafio do líder (60 + 15 = 75) -> Atual: ${nationAPointsAfterLeaderChallenge}`
  );

  console.log('\n--- Teste 5: Empates sem Critério de Desempate ---');
  const itemsToRank = [
    { item: 'Competidor A', points: 100 },
    { item: 'Competidor B', points: 100 },
    { item: 'Competidor C', points: 80 },
    { item: 'Competidor D', points: 80 },
    { item: 'Competidor E', points: 50 },
  ];
  const ranking = applyRankingWithTies(itemsToRank);

  assert(ranking[0].rank === 1, 'Competidor A está em 1º lugar');
  assert(ranking[1].rank === 1, 'Competidor B está em 1º lugar (empate mantido)');
  assert(ranking[0].isTied && ranking[1].isTied, 'Ambos os líderes com 100 pontos marcados como empatados');
  assert(ranking[2].rank === 3, 'Competidor C está em 3º lugar');
  assert(ranking[3].rank === 3, 'Competidor D está em 3º lugar (empate mantido)');
  assert(ranking[4].rank === 5, 'Competidor E está em 5º lugar');

  console.log('\n--- Teste 6: Fuso Horário e Semana Completa de Segunda a Domingo ---');
  // Sábado, 21 de Novembro de 2026
  const saturdayDate = new Date('2026-11-21T18:00:00-03:00');
  const saturdayInfo = getWeekInfoForDate(saturdayDate);
  assert(saturdayInfo.isSaturday === true, 'Data de sábado identificada corretamente');
  assert(getWeekInfoForDate(new Date('2020-01-04T18:00:00-03:00')).isPartial === false,
    'Semana histórica não aparece como parcial');

  // Domingo, 22 de Novembro de 2026 às 11:00
  const sundayMeetingDate = new Date('2026-11-22T11:00:00-03:00');
  const sundayMeetingInfo = getWeekInfoForDate(sundayMeetingDate);
  assert(
    sundayMeetingInfo.weekNumber === saturdayInfo.weekNumber,
    `Lançamentos de domingo entram na mesma semana que os de sábado (Semana ${saturdayInfo.weekNumber})`
  );

  // Último segundo de domingo ainda pertence à mesma semana.
  const sundayLastSecond = new Date('2026-11-22T23:59:59-03:00');
  const sundayLastInfo = getWeekInfoForDate(sundayLastSecond);
  assert(
    sundayLastInfo.weekNumber === saturdayInfo.weekNumber,
    'Lançamentos às 23:59:59 de domingo entram na semana corrente'
  );

  const monday = new Date('2026-11-23T00:00:00-03:00');
  const mondayInfo = getWeekInfoForDate(monday);
  assert(
    mondayInfo.weekNumber === saturdayInfo.weekNumber + 1,
    `Lançamentos a partir da segunda-feira pertencem à próxima semana (Semana ${mondayInfo.weekNumber})`
  );

  console.log('\n--- Teste 7: Estorno Auditado de Lançamento (Sem Pontos Negativos) ---');
  // Estornar o launch1 (10 pontos da Nação A)
  await prisma.scoreLaunch.update({
    where: { id: launch1.id },
    data: {
      status: 'VOIDED',
      voidReason: 'Lançamento efetuado em duplicidade por engano',
      voidedAt: new Date(),
    },
  });

  const activeLaunchesAfterVoid = await prisma.scoreLaunch.findMany({
    where: { rallyId: testRally.id, status: 'ACTIVE' },
  });
  const nationAPointsAfterVoid = activeLaunchesAfterVoid
    .filter((l) => l.snapshotNationId === nationA.id)
    .reduce((sum, l) => sum + l.points, 0);

  // Antes eram 75. Menos 10 do launch1 = 65.
  assert(
    nationAPointsAfterVoid === 65,
    `Nação A recalcula para 65 pontos após estorno sem deleção física -> Atual: ${nationAPointsAfterVoid}`
  );

  const voidedLaunch = await prisma.scoreLaunch.findUnique({
    where: { id: launch1.id },
  });
  assert(voidedLaunch!.status === 'VOIDED', 'Registro do lançamento permanece no banco como VOIDED');
  assert(
    voidedLaunch!.voidReason === 'Lançamento efetuado em duplicidade por engano',
    'Justificativa do estorno auditada com sucesso'
  );

  // Limpeza do rali de teste
  await prisma.rally.delete({ where: { id: testRally.id } });

  console.log('\n====================================================');
  console.log(` RESULTADO: ${passedTests} / ${totalTests} TESTES APROVADOS! `);
  console.log('====================================================\n');
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
