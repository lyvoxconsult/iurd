'use client';

import React from 'react';
import { 
  Trophy, 
  Flame, 
  AlertTriangle, 
  Users, 
  Crown, 
  ChevronRight, 
  PlusCircle, 
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
  rankingsData: any;
  accumulatedRankingsData: any;
  onOpenScoreModal: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({
  rankingsData,
  accumulatedRankingsData,
  onOpenScoreModal,
  onNavigateToTab,
}: DashboardViewProps) {
  const currentWeekInfo = rankingsData?.currentWeekInfo;
  const isPartial = currentWeekInfo?.isPartial;
  const isSaturday = currentWeekInfo?.isSaturday;

  const weeklyNations = rankingsData?.nations || [];
  const totalNations = accumulatedRankingsData?.nations || [];

  // Tab para o Top 3 no mobile
  const [mobileTopTab, setMobileTopTab] = React.useState<'tribes' | 'tribeLeaders' | 'nationLeaders'>('tribes');

  // Encontrar pontos semanais e totais de cada nação
  const getNationStats = (nationId: string) => {
    const weekly = weeklyNations.find((n: any) => n.item.id === nationId);
    const total = totalNations.find((n: any) => n.item.id === nationId);
    return {
      weeklyPoints: weekly?.points || 0,
      weeklyRank: weekly?.rank || 1,
      isWeeklyTied: weekly?.isTied || false,
      totalPoints: total?.points || 0,
      totalRank: total?.rank || 1,
      isTotalTied: total?.isTied || false,
    };
  };

  const topTribesWeekly = (rankingsData?.tribes || []).slice(0, 3);
  const topTribeLeadersWeekly = (rankingsData?.tribeLeaders || []).slice(0, 3);
  const topNationLeadersWeekly = (rankingsData?.nationLeaders || []).slice(0, 3);

  // Calcular total somado de pontos semanais das duas nações para barra de proporção
  const totalWeeklyPool = weeklyNations.reduce((sum: number, n: any) => sum + n.points, 0) || 1;
  const totalAccumulatedPool = totalNations.reduce((sum: number, n: any) => sum + n.points, 0) || 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* STATUS DA SEMANA - Mobile: chip compacto | Desktop: card completo */}
      {/* Versão Mobile (compacta, sem botão redundante) */}
      <div className={`sm:hidden rounded-xl border p-2.5 flex items-center justify-between gap-2.5 ${isPartial ? 'bg-amber-950/30 border-amber-600/30' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${isPartial ? 'bg-amber-500/20 text-amber-700' : 'bg-emerald-500/20 text-emerald-800'}`}>
            {isPartial ? <AlertTriangle className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
          </div>
          <p className={`text-xs font-bold truncate ${isPartial ? 'text-amber-800' : 'text-emerald-800'}`}>
            {isPartial ? (isSaturday ? 'Sábado: parcial' : 'Semana em andamento') : 'Semana encerrada'}
          </p>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 font-medium">Seg a Dom</span>
      </div>

      {/* Versão Desktop / Tablet (card detalhado com botão) */}
      <div className={`hidden sm:flex rounded-2xl border p-4 sm:p-5 shadow-xl flex-row items-center gap-3 ${isPartial ? 'bg-amber-950/40 border-amber-600/40' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex min-w-0 items-start gap-3">
          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isPartial ? 'bg-amber-500/20 text-amber-700' : 'bg-emerald-500/20 text-emerald-800'}`}>
            {isPartial ? <AlertTriangle className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
          </div>
          <div>
            <p className={`text-sm sm:text-base font-bold ${isPartial ? 'text-amber-800' : 'text-emerald-800'}`}>
              {isPartial ? (isSaturday ? 'Sábado: placar semanal parcial' : 'Semana em andamento') : 'Semana encerrada'}
            </p>
            <p className="mt-1 text-sm text-slate-300">A semana vai de segunda a domingo. Pontos lançados até o fim do domingo entram no mesmo resultado.</p>
          </div>
        </div>
        <button onClick={onOpenScoreModal} className="min-h-11 ml-auto shrink-0 rounded-xl bg-amber-500 px-4 text-sm font-bold text-slate-100 hover:bg-amber-400 transition-colors">Lançar pontos</button>
      </div>

      {/* PLACAR PRINCIPAL DAS 2 NAÇÕES */}
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center space-x-1.5 sm:space-x-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              <span>Placar Geral</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Disputa entre as nações do rali
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('rankings')}
            className="min-h-9 sm:min-h-11 text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
          >
            <span>Rankings</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Grid de 2 Nações: no mobile lado a lado (grid-cols-2), no desktop md:grid-cols-2 */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
          {weeklyNations.map((n: any) => {
            const stats = getNationStats(n.item.id);
            const isJuda = n.item.name.includes('Judá');
            const weeklyPercent = Math.round((stats.weeklyPoints / totalWeeklyPool) * 100);

            return (
              <div
                key={n.item.id}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.01] ${
                  isJuda
                    ? 'bg-gradient-to-br from-amber-950/40 via-dark-900 to-dark-950 border-amber-600/40 gold-glow'
                    : 'bg-gradient-to-br from-sky-50/80 via-dark-900 to-dark-950 border-sky-600/40 blue-glow'
                } p-3 sm:p-6 shadow-xl flex flex-col justify-between`}
              >
                {/* Cabeçalho da Nação: Posição + Nome */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="flex items-center space-x-1.5 sm:space-x-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-base shrink-0 shadow-md ${
                          stats.weeklyRank === 1
                            ? 'bg-amber-500 text-slate-100'
                            : 'bg-dark-800 text-slate-300 border border-dark-700'
                        }`}
                      >
                        {stats.weeklyRank}º
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-xl font-black text-slate-100 tracking-wide truncate">
                          {n.item.name}
                        </h3>
                        {stats.isWeeklyTied && (
                          <span className="text-[9px] sm:text-[11px] font-bold text-amber-700 block truncate">
                            (Empate {stats.weeklyRank}º)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pontos da Semana */}
                  <div className="mb-2.5 sm:mb-4">
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 block font-semibold">
                      Semana Atual
                    </span>
                    <span
                      className={`text-xl sm:text-3xl font-black ${
                        isJuda ? 'text-amber-700' : 'text-sky-700'
                      }`}
                    >
                      {stats.weeklyPoints}{' '}
                      <span className="text-xs sm:text-sm font-semibold text-slate-400">pts</span>
                    </span>
                  </div>

                  {/* Barra de Proporção Semanal */}
                  <div className="space-y-1 mb-2.5 sm:mb-5">
                    <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                      <span className="hidden sm:inline">Participação Semanal</span>
                      <span className="sm:hidden">Semana</span>
                      <span className="font-semibold text-slate-300">{weeklyPercent}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2.5 w-full bg-dark-950 rounded-full overflow-hidden border border-dark-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isJuda ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'
                        }`}
                        style={{ width: `${weeklyPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Pontuação Total Acumulada */}
                <div className="pt-2 sm:pt-4 border-t border-dark-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-300 truncate">
                      Acumulado:
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs sm:text-lg font-black text-slate-200">
                      {stats.totalPoints} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">pts</span>
                    </span>
                    {stats.isTotalTied ? (
                      <span className="text-[9px] sm:text-[11px] text-amber-700 ml-1 font-bold">
                        (Empate)
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[11px] text-slate-400 ml-1">
                        ({stats.totalRank}º Geral)
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* TOP 3 RESUMOS: Segmentado no Mobile / 3 Colunas no Desktop */}
      
      {/* Mobile Selector */}
      <div className="md:hidden space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-700" />
            <span>Destaques da Semana</span>
          </h4>
          <button
            onClick={() => onNavigateToTab('rankings')}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-medium"
          >
            Ver todos
          </button>
        </div>

        {/* Abas compactas no mobile */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-dark-950 rounded-xl border border-dark-800">
          <button
            onClick={() => setMobileTopTab('tribes')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all truncate ${
              mobileTopTab === 'tribes' ? 'bg-amber-500 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tribos
          </button>
          <button
            onClick={() => setMobileTopTab('tribeLeaders')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all truncate ${
              mobileTopTab === 'tribeLeaders' ? 'bg-amber-500 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Líd. Tribo
          </button>
          <button
            onClick={() => setMobileTopTab('nationLeaders')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all truncate ${
              mobileTopTab === 'nationLeaders' ? 'bg-amber-500 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Líd. Nação
          </button>
        </div>

        {/* Card do Tab selecionado no mobile */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-3 shadow-lg">
          {mobileTopTab === 'tribes' && (
            <div className="space-y-2">
              {topTribesWeekly.map((t: any) => (
                <div key={t.item.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-950/70 border border-dark-800/80">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-dark-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {t.rank}º
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 block truncate">{t.item.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{t.item.nation?.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 shrink-0 ml-2">{t.points} pts</span>
                </div>
              ))}
            </div>
          )}

          {mobileTopTab === 'tribeLeaders' && (
            <div className="space-y-2">
              {topTribeLeadersWeekly.map((l: any) => (
                <div key={l.item.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-950/70 border border-dark-800/80">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-dark-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {l.rank}º
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 block truncate">{l.item.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{l.item.tribe?.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 shrink-0 ml-2">{l.points} pts</span>
                </div>
              ))}
            </div>
          )}

          {mobileTopTab === 'nationLeaders' && (
            <div className="space-y-2">
              {topNationLeadersWeekly.map((l: any) => (
                <div key={l.item.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-950/70 border border-dark-800/80">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-dark-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {l.rank}º
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-100 block truncate">{l.item.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{l.item.nation?.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 shrink-0 ml-2">{l.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop / Tablet: 3 Colunas Lado a Lado */}
      <div className="hidden md:grid md:grid-cols-3 gap-5">
        
        {/* Top 3 Tribos */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-700" />
              <h4 className="text-sm font-bold text-slate-200">Top Tribos (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-700 hover:text-amber-800"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-2.5">
            {topTribesWeekly.map((t: any) => (
              <div
                key={t.item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/70 border border-dark-800/80"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-dark-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                    {t.rank}º
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{t.item.name}</span>
                    <span className="text-[10px] text-slate-400">{t.item.nation?.name}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700">{t.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Líderes de Tribo */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-700" />
              <h4 className="text-sm font-bold text-slate-200">Líderes de Tribo (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-700 hover:text-amber-800"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2.5">
            {topTribeLeadersWeekly.map((l: any) => (
              <div
                key={l.item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/70 border border-dark-800/80"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-dark-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                    {l.rank}º
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{l.item.name}</span>
                    <span className="text-[10px] text-slate-400">{l.item.tribe?.name}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700">{l.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Líderes de Nação */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-700" />
              <h4 className="text-sm font-bold text-slate-200">Líderes de Nação (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-700 hover:text-amber-800"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2.5">
            {topNationLeadersWeekly.map((l: any) => (
              <div
                key={l.item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/70 border border-dark-800/80"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-dark-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                    {l.rank}º
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{l.item.name}</span>
                    <span className="text-[10px] text-slate-400">{l.item.nation?.name}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700">{l.points} pts</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
