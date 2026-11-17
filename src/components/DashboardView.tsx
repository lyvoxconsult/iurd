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
    <div className="space-y-6">
      
      {/* Banner de Aviso de Semana Parcial / Sábado */}
      {isPartial && (
        <div className="bg-gradient-to-r from-amber-950/70 via-dark-900 to-amber-950/70 border border-amber-600/40 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 flex-shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-amber-300">
                  {isSaturday ? 'SÁBADO: PLACAR SEMANAL PARCIAL' : 'SEMANA DE PONTUAÇÃO EM ANDAMENTO (PARCIAL)'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  America/Sao_Paulo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                A semana de pontuação vai de <strong>segunda-feira a domingo às 23:59</strong>. No sábado o placar é parcial e os lançamentos de domingo continuam somando nesta mesma semana.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenScoreModal}
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 text-xs font-bold transition-all shadow-md flex-shrink-0 ml-4"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Agora</span>
          </button>
        </div>
      )}

      {/* PLACAR PRINCIPAL DAS 2 NAÇÕES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-slate-100 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Placar Geral das Nações</span>
            </h2>
            <p className="text-xs text-slate-400">
              Disputa oficial entre as 2 grandes nações do Rali Umarizal
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('rankings')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>Ver Rankings Detalhados</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {weeklyNations.map((n: any, idx: number) => {
            const stats = getNationStats(n.item.id);
            const isJuda = n.item.name.includes('Judá');
            const themeColor = isJuda ? 'amber' : 'sky';
            const weeklyPercent = Math.round((stats.weeklyPoints / totalWeeklyPool) * 100);
            const totalPercent = Math.round((stats.totalPoints / totalAccumulatedPool) * 100);

            return (
              <div
                key={n.item.id}
                className={`relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.01] ${
                  isJuda
                    ? 'bg-gradient-to-br from-amber-950/40 via-dark-900 to-dark-950 border-amber-600/40 gold-glow'
                    : 'bg-gradient-to-br from-sky-950/40 via-dark-900 to-dark-950 border-sky-600/40 blue-glow'
                } p-6 shadow-2xl`}
              >
                {/* Badge de Posição / Empate */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-md ${
                        stats.weeklyRank === 1
                          ? 'bg-amber-500 text-dark-950'
                          : 'bg-dark-800 text-slate-300 border border-dark-700'
                      }`}
                    >
                      {stats.weeklyRank}º
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-slate-100 tracking-wide">
                        {n.item.name}
                      </h3>
                      {stats.isWeeklyTied && (
                        <span className="text-[11px] font-bold text-amber-400">
                          (Empate em {stats.weeklyRank}º Lugar)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">
                      Semana Atual
                    </span>
                    <span
                      className={`text-3xl font-black ${
                        isJuda ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      {stats.weeklyPoints}{' '}
                      <span className="text-sm font-semibold text-slate-400">pts</span>
                    </span>
                  </div>
                </div>

                {/* Barra de Proporção Semanal */}
                <div className="space-y-1 mb-5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Participação Semanal</span>
                    <span className="font-semibold text-slate-300">{weeklyPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-dark-950 rounded-full overflow-hidden border border-dark-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isJuda ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'
                      }`}
                      style={{ width: `${weeklyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rodapé do Card: Pontuação Total Acumulada */}
                <div className="pt-4 border-t border-dark-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-slate-300">
                      Acumulado no Rali:
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-200">
                      {stats.totalPoints} <span className="text-xs font-semibold text-slate-400">pts</span>
                    </span>
                    {stats.isTotalTied ? (
                      <span className="text-[11px] text-amber-400 ml-2 font-bold">
                        (Empate {stats.totalRank}º)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 ml-2">
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

      {/* TOP 3 RESUMOS: TRIBOS E LÍDERES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Top 3 Tribos */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-200">Top Tribos (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-400 hover:text-amber-300"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-2.5">
            {topTribesWeekly.map((t: any, idx: number) => (
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
                <span className="text-xs font-black text-amber-400">{t.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Líderes de Tribo */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-200">Líderes de Tribo (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-400 hover:text-amber-300"
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
                <span className="text-xs font-black text-amber-400">{l.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Líderes de Nação */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-200">Líderes de Nação (Semana)</h4>
            </div>
            <button
              onClick={() => onNavigateToTab('rankings')}
              className="text-[11px] text-amber-400 hover:text-amber-300"
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
                <span className="text-xs font-black text-amber-400">{l.points} pts</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
