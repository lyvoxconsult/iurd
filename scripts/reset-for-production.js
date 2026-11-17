const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log('--- Preparando banco limpo para produção ---');

  // Atualizar nome de qualquer rali para Rali Umarizal 2026
  await prisma.rally.updateMany({
    data: { name: 'Rali Umarizal 2026' },
  });

  // Limpar pontuações de teste anteriores
  await prisma.scoreLaunch.deleteMany({});
  await prisma.leaderScoreLaunch.deleteMany({});

  // Limpar todos os desafios pré-setados (conforme solicitado pelo usuário:
  // "nao deve ter desafios pré setados, eu quero que ao lançar eu escreva qual foi o desafio")
  await prisma.challenge.deleteMany({});

  console.log('Desafios pré-setados removidos. Placares zerados.');
  console.log('Estrutura de 2 Nações e 12 Tribos preservada.');
  console.log('Rali Umarizal 2026 pronto para uso!');
}

reset()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
