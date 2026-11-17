const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Sistema IURD Umarizal ---');

  // Verifica se já existe um rali
  let rally = await prisma.rally.findFirst({
    where: { isActive: true },
  });

  if (!rally) {
    rally = await prisma.rally.create({
      data: {
        name: 'Rali Umarizal 2026',
        startDate: new Date('2026-11-01T00:00:00-03:00'),
        isActive: true,
      },
    });
    console.log(`Rali criado: ${rally.name} (${rally.id})`);
  } else {
    // Atualizar nome para Umarizal caso estivesse anterior
    rally = await prisma.rally.update({
      where: { id: rally.id },
      data: { name: 'Rali Umarizal 2026' },
    });
  }

  // 1. Criar as 2 Nações
  const nationsData = [
    { name: 'Nação Judá', color: '#f59e0b', orderIndex: 1 },
    { name: 'Nação Benjamim', color: '#0ea5e9', orderIndex: 2 },
  ];

  const nations = [];
  for (const n of nationsData) {
    let nation = await prisma.nation.findFirst({
      where: { rallyId: rally.id, name: n.name },
    });
    if (!nation) {
      nation = await prisma.nation.create({
        data: {
          rallyId: rally.id,
          name: n.name,
          color: n.color,
          orderIndex: n.orderIndex,
        },
      });
      console.log(`Nação criada: ${nation.name}`);
    }
    nations.push(nation);
  }

  const juda = nations.find((n) => n.name === 'Nação Judá');
  const benjamim = nations.find((n) => n.name === 'Nação Benjamim');

  // 2. Criar 6 Tribos para Judá e 6 Tribos para Benjamim
  const judaTribes = [
    { name: 'Tribo Leão', code: 'LEAO', orderIndex: 1 },
    { name: 'Tribo Guerreiros', code: 'GUERR', orderIndex: 2 },
    { name: 'Tribo Vencedores', code: 'VENC', orderIndex: 3 },
    { name: 'Tribo Conquistadores', code: 'CONQ', orderIndex: 4 },
    { name: 'Tribo Aliança', code: 'ALIAN', orderIndex: 5 },
    { name: 'Tribo Firmeza', code: 'FIRM', orderIndex: 6 },
  ];

  const benjamimTribes = [
    { name: 'Tribo Águia', code: 'AGUIA', orderIndex: 1 },
    { name: 'Tribo Valentes', code: 'VALEN', orderIndex: 2 },
    { name: 'Tribo Sentinela', code: 'SENT', orderIndex: 3 },
    { name: 'Tribo Chama', code: 'CHAMA', orderIndex: 4 },
    { name: 'Tribo Rocha', code: 'ROCHA', orderIndex: 5 },
    { name: 'Tribo Redenção', code: 'REDEN', orderIndex: 6 },
  ];

  const allTribes = [];

  for (const t of judaTribes) {
    let tribe = await prisma.tribe.findFirst({
      where: { rallyId: rally.id, nationId: juda.id, name: t.name },
    });
    if (!tribe) {
      tribe = await prisma.tribe.create({
        data: {
          rallyId: rally.id,
          nationId: juda.id,
          name: t.name,
          code: t.code,
          orderIndex: t.orderIndex,
        },
      });
      console.log(`Tribo criada em Judá: ${tribe.name}`);
    }
    allTribes.push(tribe);
  }

  for (const t of benjamimTribes) {
    let tribe = await prisma.tribe.findFirst({
      where: { rallyId: rally.id, nationId: benjamim.id, name: t.name },
    });
    if (!tribe) {
      tribe = await prisma.tribe.create({
        data: {
          rallyId: rally.id,
          nationId: benjamim.id,
          name: t.name,
          code: t.code,
          orderIndex: t.orderIndex,
        },
      });
      console.log(`Tribo criada em Benjamim: ${tribe.name}`);
    }
    allTribes.push(tribe);
  }

  // 3. Sem desafios pré-setados: Desafios são digitados dinamicamente no momento do lançamento pelo usuário!
  console.log('Sem desafios pré-setados: serão definidos no momento do lançamento.');

  // 4. Cadastrar Líderes e Pessoas Iniciais para demonstração e testes
  const leaoTribe = allTribes.find((t) => t.name === 'Tribo Leão');
  const aguiaTribe = allTribes.find((t) => t.name === 'Tribo Águia');

  const initialPeople = [
    {
      name: 'Pastor Marcos Silva',
      nationId: juda.id,
      tribeId: leaoTribe.id,
      category: 'obreiro',
      role: 'lider_nacao',
    },
    {
      name: 'Pastor Daniel Souza',
      nationId: benjamim.id,
      tribeId: aguiaTribe.id,
      category: 'obreiro',
      role: 'lider_nacao',
    },
    {
      name: 'Lucas Ferreira',
      nationId: juda.id,
      tribeId: leaoTribe.id,
      category: 'jovem',
      role: 'lider_tribo',
    },
    {
      name: 'Gabriel Santos',
      nationId: benjamim.id,
      tribeId: aguiaTribe.id,
      category: 'jovem',
      role: 'lider_tribo',
    },
    {
      name: 'Matheus Oliveira',
      nationId: juda.id,
      tribeId: leaoTribe.id,
      category: 'jovem',
      role: 'participante',
    },
    {
      name: 'Ana Carolina',
      nationId: benjamim.id,
      tribeId: aguiaTribe.id,
      category: 'jovem',
      role: 'participante',
    },
  ];

  for (const p of initialPeople) {
    const exists = await prisma.person.findFirst({
      where: { rallyId: rally.id, name: p.name },
    });
    if (!exists) {
      await prisma.person.create({
        data: {
          rallyId: rally.id,
          name: p.name,
          nationId: p.nationId,
          tribeId: p.tribeId,
          category: p.category,
          role: p.role,
        },
      });
      console.log(`Pessoa cadastrada: ${p.name} (${p.role})`);
    }
  }

  console.log('--- Seed Concluído com Sucesso! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
