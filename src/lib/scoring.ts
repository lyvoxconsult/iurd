import { toZonedTime, format } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns';

export const TIMEZONE_SP = 'America/Sao_Paulo';

/**
 * Retorna as informações da semana (segunda a domingo) para uma determinada data no fuso de São Paulo.
 */
export function getWeekInfoForDate(dateInput: Date | string | number) {
  const dateObj = new Date(dateInput);
  const zonedDate = toZonedTime(dateObj, TIMEZONE_SP);

  const weekNumber = getISOWeek(zonedDate);
  const weekYear = getISOWeekYear(zonedDate);
  const weekStart = startOfISOWeek(zonedDate);
  const weekEnd = endOfISOWeek(zonedDate);

  const dayOfWeek = zonedDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  // No sábado ou durante a semana aberta até domingo à noite, é parcial
  const isPartial = true; // Toda semana em andamento antes de fechamento formal é parcial

  return {
    weekNumber,
    weekYear,
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`,
    weekStart,
    weekEnd,
    formattedRange: `${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`,
    dayOfWeek,
    isSaturday,
    isSunday,
    isPartial,
  };
}

/**
 * Retorna a informação da semana atual no fuso America/Sao_Paulo
 */
export function getCurrentWeekInfo() {
  return getWeekInfoForDate(new Date());
}

export interface RankedItem<T> {
  item: T;
  points: number;
  rank: number;
  isTied: boolean;
}

/**
 * Aplica classificação com tratamento estrito de empates.
 * Empatados recebem rigorosamente a mesma posição. Não há critério de desempate.
 * Exemplo: 100, 100, 80 -> Ranks: 1, 1, 3 (standard competition ranking).
 */
export function applyRankingWithTies<T>(
  itemsWithPoints: Array<{ item: T; points: number }>
): RankedItem<T>[] {
  // Ordenar por pontos decrescente
  const sorted = [...itemsWithPoints].sort((a, b) => b.points - a.points);

  const result: RankedItem<T>[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (i > 0 && current.points === sorted[i - 1].points) {
      // Empate com o anterior: mesma posição do anterior
      const previousRank = result[i - 1].rank;
      result.push({
        item: current.item,
        points: current.points,
        rank: previousRank,
        isTied: true,
      });
      // Marcar o anterior como empatado também
      result[i - 1].isTied = true;
    } else {
      // Nova pontuação: posição baseada no índice real (1-based)
      currentRank = i + 1;
      result.push({
        item: current.item,
        points: current.points,
        rank: currentRank,
        isTied: false,
      });
    }
  }

  return result;
}
