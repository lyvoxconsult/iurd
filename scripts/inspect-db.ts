import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  const rallies = await prisma.rally.findMany({ include: { _count: true } });
  const nations = await prisma.nation.findMany({ include: { _count: { select: { tribes: true, people: true } } } });
  const tribes = await prisma.tribe.findMany({ include: { _count: { select: { people: true } } } });
  const people = await prisma.person.findMany({ include: { nation: true, tribe: true } });
  const challenges = await prisma.challenge.findMany();
  const scoreLaunches = await prisma.scoreLaunch.findMany();
  const leaderLaunches = await prisma.leaderScoreLaunch.findMany();

  console.log('=== CONTAGEM DE DADOS ATUAIS NO SQLITE ===');
  console.log('Rallies:', rallies.length);
  console.log('Nations:', nations.length);
  console.log('Tribes:', tribes.length);
  console.log('People:', people.length);
  console.log('Challenges:', challenges.length);
  console.log('Score Launches (Desafios):', scoreLaunches.length);
  console.log('Leader Score Launches (Líderes):', leaderLaunches.length);

  console.log('\n--- Rallies Detalhados ---');
  rallies.forEach((r) =>
    console.log(
      `- ID: ${r.id} | Nome: "${r.name}" | Ativo: ${r.isActive} | Início: ${r.startDate.toISOString()} | Fim: ${r.endDate?.toISOString() || 'null'}`
    )
  );

  console.log('\n--- Nações Detalhadas ---');
  nations.forEach((n) =>
    console.log(
      `- ID: ${n.id} | Nome: "${n.name}" | Cor: ${n.color} | Rali: ${n.rallyId} | Tribos: ${n._count.tribes} | Pessoas: ${n._count.people}`
    )
  );

  console.log('\n--- Tribos (Total: ' + tribes.length + ') ---');
  tribes.forEach((t) =>
    console.log(`- ID: ${t.id} | Nome: "${t.name}" | Nação: ${t.nationId} | Pessoas: ${t._count.people}`)
  );

  console.log('\n--- Integrantes (Total: ' + people.length + ') ---');
  people.forEach((p) =>
    console.log(
      `- ID: ${p.id} | Nome: "${p.name}" | Nação: "${p.nation?.name}" | Tribo: "${p.tribe?.name}" | Cat: ${p.category} | Função: ${p.role}`
    )
  );

  console.log('\n--- Desafios (Total: ' + challenges.length + ') ---');
  challenges.forEach((c) =>
    console.log(`- ID: ${c.id} | Título: "${c.title}" | Pontos Padrão: ${c.defaultPoints}`)
  );

  console.log('\n--- Lançamentos de Desafio (Total: ' + scoreLaunches.length + ') ---');
  scoreLaunches.forEach((s) =>
    console.log(
      `- ID: ${s.id} | Pontos: ${s.points} | Alvo: ${s.targetType} | Status: ${s.status} | Semana: ${s.weekNumber}/${s.weekYear}`
    )
  );

  console.log('\n--- Lançamentos de Líder (Total: ' + leaderLaunches.length + ') ---');
  leaderLaunches.forEach((l) =>
    console.log(
      `- ID: ${l.id} | Líder: ${l.leaderId} | Pontos: ${l.points} | Motivo: "${l.reason}" | Status: ${l.status}`
    )
  );
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
