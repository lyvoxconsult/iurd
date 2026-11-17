import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
  const rally = await prisma.rally.findFirst({ where: { isActive: true } });
  if (!rally) throw new Error('Nenhum rali ativo');

  const nation = await prisma.nation.findFirst({ where: { rallyId: rally.id } });
  if (!nation) throw new Error('Nenhuma nação');

  const tribe = await prisma.tribe.findFirst({ where: { nationId: nation.id } });
  if (!tribe) throw new Error('Nenhuma tribo');

  console.log('--- Testando POST /api/people com categoria jovem ---');
  const resValid = await fetch('http://localhost:3000/api/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Teste HTTP Jovem',
      nationId: nation.id,
      tribeId: tribe.id,
      category: 'jovem',
      role: 'participante',
    }),
  });
  const dataValid = await resValid.json();
  console.log('Status jovem:', resValid.status, dataValid);

  console.log('\n--- Testando POST /api/people com categoria membro (deve falhar) ---');
  const resInvalid = await fetch('http://localhost:3000/api/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Teste HTTP Membro Invalido',
      nationId: nation.id,
      tribeId: tribe.id,
      category: 'membro',
      role: 'participante',
    }),
  });
  const dataInvalid = await resInvalid.json();
  console.log('Status membro (esperado 400):', resInvalid.status, dataInvalid);

  if (resValid.status === 200 && resInvalid.status === 400) {
    console.log('\n✅ SUCESSO: API HTTP validada com sucesso! Categoria "membro" foi rejeitada pela validação do servidor.');
    // Limpar o registro de teste
    if (dataValid?.person?.id) {
      await prisma.person.delete({ where: { id: dataValid.person.id } });
      console.log('Registro temporário de teste removido.');
    }
  } else {
    throw new Error('Falha na validação da API HTTP');
  }
}

testApi()
  .catch((e) => {
    console.error('❌ ERRO:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
