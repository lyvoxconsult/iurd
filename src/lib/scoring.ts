import { toZonedTime, format } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns';

export const TIMEZONE_SP = 'America/Sao_Paulo';

/** A semana de pontuação vai de segunda 00:00 a domingo 23:59:59 em São Paulo. */
export function getWeekInfoForDate(dateInput: Date | string | number) {
  const dateObj = new Date(dateInput);
  if (Number.isNaN(dateObj.getTime())) throw new Error('Data de pontuação inválida');
  const zonedDate = toZonedTime(dateObj, TIMEZONE_SP);
  const weekNumber = getISOWeek(zonedDate);
  const weekYear = getISOWeekYear(zonedDate);
  const weekStart = startOfISOWeek(zonedDate);
  const weekEnd = endOfISOWeek(zonedDate);
  const dayOfWeek = zonedDate.getDay();
  const isPartial = toZonedTime(new Date(), TIMEZONE_SP).getTime() <= weekEnd.getTime();

  return {
    weekNumber,
    weekYear,
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`,
    weekStart,
    weekEnd,
    formattedRange: `${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`,
    dayOfWeek,
    isSaturday: dayOfWeek === 6,
    isSunday: dayOfWeek === 0,
    isPartial,
    statusLabel: isPartial ? (dayOfWeek === 6 ? 'Sábado: Placar Parcial' : 'Semana em Andamento (Parcial)') : 'Semana encerrada',
  };
}

export function getCurrentWeekInfo() {
  return getWeekInfoForDate(new Date());
}

export interface RankedItem<T> {
  item: T;
  points: number;
  rank: number;
  isTied: boolean;
}

/** Empatados têm a mesma posição: 100, 100, 80 => 1, 1, 3. */
export function applyRankingWithTies<T>(itemsWithPoints: Array<{ item: T; points: number }>): RankedItem<T>[] {
  const sorted = [...itemsWithPoints].sort((a, b) => b.points - a.points);
  const result: RankedItem<T>[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const previous = result[i - 1];
    const tied = !!previous && sorted[i].points === previous.points;
    if (tied) previous.isTied = true;
    result.push({ item: sorted[i].item, points: sorted[i].points, rank: tied ? previous.rank : i + 1, isTied: tied });
  }
  return result;
}
