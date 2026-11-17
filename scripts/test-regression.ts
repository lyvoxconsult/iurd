import { getWeekInfoForDate } from '../src/lib/scoring';
import { CategoryEnum, scoreLaunchSchema } from '../src/lib/validations';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

for (const category of ['jovem', 'membro', 'obreiro', 'colaborador']) {
  assert(CategoryEnum.safeParse(category).success, `Categoria rejeitada: ${category}`);
}

const saturday = getWeekInfoForDate('2026-11-21T18:00:00-03:00');
const sundayLastSecond = getWeekInfoForDate('2026-11-22T23:59:59-03:00');
const monday = getWeekInfoForDate('2026-11-23T00:00:00-03:00');
assert(saturday.weekKey === sundayLastSecond.weekKey, 'Domingo foi movido para outra semana');
assert(monday.weekKey !== saturday.weekKey, 'Segunda não iniciou outra semana');
assert(!getWeekInfoForDate('2020-01-04T18:00:00-03:00').isPartial,
  'Semana histórica marcada como parcial');

const launch = {
  challengeId: 'challenge', targetType: 'nation', targetId: 'nation', points: 10,
};
assert(!scoreLaunchSchema.safeParse({ ...launch, scoreDate: '2026-11-22T23:59:59' }).success,
  'Data sem fuso foi aceita');
assert(scoreLaunchSchema.safeParse({ ...launch, scoreDate: '2026-11-22T23:59:59-03:00' }).success,
  'Data com fuso foi rejeitada');

console.log('Categorias, semana completa, histórico e fuso obrigatório: OK');
