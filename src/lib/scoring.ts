import { toZonedTime, format } from 'date-fns-tz';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addDays } from 'date-fns';

export const TIMEZONE_SP = 'America/Sao_Paulo';
export const SUNDAY_CLOSING_HOUR = 16; // 16:00 (4h da tarde de domingo - final do encontro)

/**
 * Retorna as informações da semana para um lançamento ou data no fuso de São Paulo.
 * A pontuação semanal é somada e encerrada às 16:00 do domingo no final do encontro.
 *
 * - Lançamentos de Segunda 00:00 até Domingo 15:59:59 pertencem à semana corrente do encontro.
 * - Lançamentos feitos no Domingo a partir das 16:00:00 pertencem à próxima semana do rali (próximo ciclo).
 */
export function getWeekInfoForDate(dateInput: Date | string | number) {
  const dateObj = new Date(dateInput);
  const zonedDate = toZonedTime(dateObj, TIMEZONE_SP);

  const dayOfWeek = zonedDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();

  // Se for domingo às 16:00 ou posterior, o encontro da semana já encerrou e foi somado
  const isSunday = dayOfWeek === 0;
  const isSundayAfter16h = isSunday && (hours > SUNDAY_CLOSING_HOUR || (hours === SUNDAY_CLOSING_HOUR && minutes >= 0));
  const isSundayBefore16h = isSunday && !isSundayAfter16h;
  const isSaturday = dayOfWeek === 6;

  // Lançamentos após 16h de domingo são alocados para o ciclo da próxima semana
  const dateForWeekAssignment = isSundayAfter16h ? addDays(zonedDate, 1) : zonedDate;

  const weekNumber = getISOWeek(dateForWeekAssignment);
  const weekYear = getISOWeekYear(dateForWeekAssignment);
  const weekStart = startOfISOWeek(dateForWeekAssignment);
  const weekEnd = endOfISOWeek(dateForWeekAssignment);

  return {
    weekNumber,
    weekYear,
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`,
    weekStart,
    weekEnd,
    formattedRange: `${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`,
    dayOfWeek,
    hours,
    minutes,
    isSaturday,
    isSunday,
    isSundayBefore16h,
    isSundayAfter16h,
    isPartial: !isSundayAfter16h && (dayOfWeek !== 0 || isSundayBefore16h),
  };
}

/**
 * Retorna a informação da semana atual no fuso America/Sao_Paulo para visualização do Placar.
 *
 * Regra do Domingo à tarde (a partir das 16h):
 * O encontro da semana acabou de ser somado às 16:00. O usuário visualiza o placar
 * CONSOLIDADO do encontro que acabou de finalizar (isPartial = false).
 * O novo ciclo semanal passa a ser o padrão no painel a partir de segunda-feira 00:00.
 */
export function getCurrentWeekInfo() {
  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE_SP);

  const dayOfWeek = zonedNow.getDay();
  const hours = zonedNow.getHours();
  const minutes = zonedNow.getMinutes();

  const isSunday = dayOfWeek === 0;
  const isSundayAfter16h = isSunday && (hours > SUNDAY_CLOSING_HOUR || (hours === SUNDAY_CLOSING_HOUR && minutes >= 0));
  const isSundayBefore16h = isSunday && !isSundayAfter16h;
  const isSaturday = dayOfWeek === 6;

  // No domingo após as 16h, exibimos o placar consolidado daquele encontro
  const weekNumber = getISOWeek(zonedNow);
  const weekYear = getISOWeekYear(zonedNow);
  const weekStart = startOfISOWeek(zonedNow);
  const weekEnd = endOfISOWeek(zonedNow);

  // É parcial se for antes de domingo às 16:00
  const isPartial = !isSundayAfter16h;

  let statusLabel = 'Semana em Andamento (Parcial)';
  if (isSundayAfter16h) {
    statusLabel = 'Placar Consolidado (Encontro Encerrado às 16h)';
  } else if (isSundayBefore16h) {
    statusLabel = 'Domingo: Encontro em Andamento (Apuração às 16h)';
  } else if (isSaturday) {
    statusLabel = 'Sábado: Placar Parcial';
  }

  return {
    weekNumber,
    weekYear,
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`,
    weekStart,
    weekEnd,
    formattedRange: `${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`,
    dayOfWeek,
    hours,
    minutes,
    isSaturday,
    isSunday,
    isSundayBefore16h,
    isSundayAfter16h,
    isPartial,
    statusLabel,
  };
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
