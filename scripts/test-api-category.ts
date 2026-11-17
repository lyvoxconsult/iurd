import { CategoryEnum } from '../src/lib/validations';

async function main() {
  for (const category of ['jovem', 'membro', 'obreiro', 'colaborador']) {
    if (!CategoryEnum.safeParse(category).success) throw new Error(`Categoria rejeitada: ${category}`);
  }
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/people`);
  if (response.status !== 401) {
    throw new Error(`API pessoal sem autenticação deve retornar 401, retornou ${response.status}`);
  }
  console.log('Categorias válidas e API pessoal protegida: OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
