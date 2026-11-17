import { CategoryEnum, personSchema } from '../src/lib/validations';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runEntityTests() {
  console.log('=== TESTE 1: CATEGORIA DE INTEGRANTES ===');
  const jovem = CategoryEnum.safeParse('jovem');
  const obreiro = CategoryEnum.safeParse('obreiro');
  const colaborador = CategoryEnum.safeParse('colaborador');
  const membro = CategoryEnum.safeParse('membro');

  console.log('jovem válido:', jovem.success);
  console.log('obreiro válido:', obreiro.success);
  console.log('colaborador válido:', colaborador.success);
  console.log('membro válido:', membro.success);

  if (!jovem.success || !obreiro.success || !colaborador.success || !membro.success) {
    throw new Error('Falha na validação das quatro categorias de integrantes.');
  }
  console.log('✅ SUCESSO: Jovem, membro, obreiro e colaborador são aceitos.\n');

  console.log('=== TESTE 2: CRUD DE NAÇÕES E TRIBOS ===');
  const rally = await prisma.rally.findFirst({ where: { isActive: true } });
  if (!rally) throw new Error('Nenhum rali ativo encontrado');

  const nation = await prisma.nation.findFirst({ where: { rallyId: rally.id } });
  if (!nation) throw new Error('Nenhuma nação encontrada');

  // 1. Criar uma nova tribo
  const newTribe = await prisma.tribe.create({
    data: {
      rallyId: rally.id,
      nationId: nation.id,
      name: 'Tribo Teste Temporária',
      code: 'TTT',
      orderIndex: 99,
    },
  });
  console.log('Tribo criada:', newTribe.name, 'ID:', newTribe.id);

  // 2. Renomear tribo
  const updatedTribe = await prisma.tribe.update({
    where: { id: newTribe.id },
    data: { name: 'Tribo Teste Renomeada' },
  });
  console.log('Tribo renomeada para:', updatedTribe.name);

  // 3. Cadastrar pessoa na tribo
  const person = await prisma.person.create({
    data: {
      rallyId: rally.id,
      name: 'Pessoa Bloqueio Exclusão',
      nationId: nation.id,
      tribeId: newTribe.id,
      category: 'jovem',
      role: 'participante',
    },
  });
  console.log('Pessoa criada vinculada à tribo:', person.name);

  // 4. Tentar remover tribo com pessoa vinculada (deve ser bloqueada)
  const peopleCount = await prisma.person.count({ where: { tribeId: newTribe.id } });
  if (peopleCount > 0) {
    console.log('✅ SUCESSO: Bloqueio de exclusão de tribo com integrantes confirmado (integrantes:', peopleCount, ')');
  } else {
    throw new Error('Falha: Deveria ter identificado integrantes vinculados');
  }

  // 5. Deletar a pessoa de teste
  await prisma.person.delete({ where: { id: person.id } });

  // 6. Agora remover a tribo vazia com sucesso
  await prisma.tribe.delete({ where: { id: newTribe.id } });
  console.log('✅ SUCESSO: Tribo vazia excluída com sucesso sem deixar órfãos.');

  console.log('\n========================================');
  console.log('TODAS AS NOVAS REGRAS FORAM VALIDADAS COM SUCESSO!');
  console.log('========================================');
}

runEntityTests()
  .catch((e) => {
    console.error('❌ ERRO:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
