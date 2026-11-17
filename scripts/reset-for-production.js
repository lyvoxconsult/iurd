const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Evita que a execução acidental apague todo o histórico de pontuação.
if (process.env.IURD_CONFIRM_DESTRUCTIVE_RESET !== 'DELETE_ALL_SCORES_AND_CHALLENGES') {
  console.error('Reset destrutivo bloqueado. Faça backup do banco e confirme explicitamente a operação.');
  process.exit(1);
}

async function reset() {
  console.log('--- Preparando banco limpo para produção ---');

  // Limpar pontuações de teste anteriores
  await prisma.scoreLaunch.deleteMany({});
  await prisma.leaderScoreLaunch.deleteMany({});

  // Limpar todos os desafios pré-setados (conforme solicitado pelo usuário:
  // "nao deve ter desafios pré setados, eu quero que ao lançar eu escreva qual foi o desafio")
  await prisma.challenge.deleteMany({});

  console.log('Desafios pré-setados removidos. Placares zerados.');
  console.log('Estrutura de 2 Nações e 12 Tribos preservada.');
  console.log('Rali pronto para uso.');
}

reset()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
