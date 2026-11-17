'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  Crown, 
  Users, 
  Calendar, 
  Filter,
  Medal,
  Sparkles
} from 'lucide-react';

interface RankingsViewProps {
  rankingsData: any;
  accumulatedRankingsData: any;
  period: 'week' | 'total';
  setPeriod: (p: 'week' | 'total') => void;
  selectedWeek: { weekNumber: number; weekYear: number } | null;
  setSelectedWeek: (w: { weekNumber: number; weekYear: number } | null) => void;
}

export default function RankingsView({
  rankingsData,
  accumulatedRankingsData,
  period,
  setPeriod,
  selectedWeek,
  setSelectedWeek,
}: RankingsViewProps) {
  const [activeTab, setActiveTab] = useState<'nations' | 'tribes' | 'tribeLeaders' | 'nationLeaders'>('nations');

  const currentData = period === 'week' ? rankingsData : accumulatedRankingsData;

  const nationsList = currentData?.nations || [];
  const tribesList = currentData?.tribes || [];
  const tribeLeadersList = currentData?.tribeLeaders || [];
  const nationLeadersList = currentData?.nationLeaders || [];
  const availableWeeks = rankingsData?.availableWeeks || [];

  const maxPoints = Math.max(
    1,
    activeTab === 'nations'
      ? Math.max(...nationsList.map((i: any) => i.points), 1)
      : activeTab === 'tribes'
      ? Math.max(...tribesList.map((i: any) => i.points), 1)
      : activeTab === 'tribeLeaders'
      ? Math.max(...tribeLeadersList.map((i: any) => i.points), 1)
      : Math.max(...nationLeadersList.map((i: any) => i.points), 1)
  );

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtro de Período e Semanas */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Alternador de Período (Semanal vs Acumulado) */}
        <div className="flex items-center space-x-2 bg-dark-950 p-1 rounded-xl border border-dark-800 w-full sm:w-auto">
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
              period === 'week'
                ? 'bg-amber-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Visão Semanal</span>
          </button>
          <button
            onClick={() => setPeriod('total')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
              period === 'total'
                ? 'bg-amber-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Total Acumulado do Rali</span>
          </button>
        </div>

        {/* Seletor de Semanas (quando em visão semanal) */}
        {period === 'week' && availableWeeks.length > 0 && (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <span>Semana:</span>
            </span>
            <select
              value={selectedWeek ? `${selectedWeek.weekYear}-${selectedWeek.weekNumber}` : ''}
              onChange={(e) => {
                const [year, num] = e.target.value.split('-').map(Number);
                setSelectedWeek({ weekYear: year, weekNumber: num });
              }}
              className="bg-dark-950 border border-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500"
            >
              {availableWeeks.map((w: any) => (
                <option key={`${w.weekYear}-${w.weekNumber}`} value={`${w.weekYear}-${w.weekNumber}`}>
                  Semana {w.weekNumber} ({w.weekYear})
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Abas dos 4 Rankings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { id: 'nations', label: 'Nações (2)', icon: Trophy, count: nationsList.length },
          { id: 'tribes', label: 'Tribos (12)', icon: Flame, count: tribesList.length },
          { id: 'tribeLeaders', label: 'Líderes de Tribo', icon: Crown, count: tribeLeadersList.length },
          { id: 'nationLeaders', label: 'Líderes de Nação', icon: Award, count: nationLeadersList.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-dark-900 border-amber-500 shadow-lg gold-glow text-amber-400'
                  : 'bg-dark-900/60 border-dark-800 text-slate-400 hover:border-dark-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-950 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-100">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* LISTA DO RANKING SELECIONADO */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-dark-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Classificação Oficial</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-dark-950 border border-dark-700 text-slate-300">
                {period === 'week' ? 'Semana Atual' : 'Geral Acumulado'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empates mantêm a mesma posição com transparência total.
            </p>
          </div>
        </div>

        {/* Renderização condicional dos itens */}
        <div className="space-y-3">
          
          {/* TAB 1: NAÇÕES */}
          {activeTab === 'nations' && (
            nationsList.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">Nenhum dado encontrado.</p>
            ) : (
              nationsList.map((rankItem: any) => {
                const percent = Math.round((rankItem.points / maxPoints) * 100);
                const isFirst = rankItem.rank === 1;
                return (
                  <div
                    key={rankItem.item.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      isFirst
                        ? 'bg-amber-950/20 border-amber-600/50'
                        : 'bg-dark-950/80 border-dark-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div
                        className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md ${
                          isFirst ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-300'
                        }`}
                      >
                        {rankItem.rank}º
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-black text-slate-100">{rankItem.item.name}</h4>
                          {rankItem.isTied && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              Empate
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">Nação Oficial do Rali</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-64 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-lg font-black text-amber-400 w-20 text-right">
                        {rankItem.points} <span className="text-xs text-slate-400">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: TRIBOS */}
          {activeTab === 'tribes' && (
            tribesList.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">Nenhuma tribo encontrada.</p>
            ) : (
              tribesList.map((rankItem: any) => {
                const percent = Math.round((rankItem.points / maxPoints) * 100);
                const isFirst = rankItem.rank === 1;
                return (
                  <div
                    key={rankItem.item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isFirst
                        ? 'bg-amber-950/20 border-amber-600/40'
                        : 'bg-dark-950/80 border-dark-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div
                        className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md ${
                          isFirst ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-300'
                        }`}
                      >
                        {rankItem.rank}º
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-100">{rankItem.item.name}</h4>
                          {rankItem.isTied && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              Empate
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {rankItem.item.nation?.name || 'Nação'}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-56 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-base font-black text-amber-400 w-16 text-right">
                        {rankItem.points} <span className="text-xs text-slate-400">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 3: LÍDERES DE TRIBO */}
          {activeTab === 'tribeLeaders' && (
            tribeLeadersList.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">Nenhum líder de tribo pontuado.</p>
            ) : (
              tribeLeadersList.map((rankItem: any) => {
                const percent = Math.round((rankItem.points / maxPoints) * 100);
                const isFirst = rankItem.rank === 1;
                return (
                  <div
                    key={rankItem.item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isFirst
                        ? 'bg-amber-950/20 border-amber-600/40'
                        : 'bg-dark-950/80 border-dark-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div
                        className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md ${
                          isFirst ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-300'
                        }`}
                      >
                        {rankItem.rank}º
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-100">{rankItem.item.name}</h4>
                          {rankItem.isTied && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              Empate
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {rankItem.item.tribe?.name} ({rankItem.item.nation?.name})
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-56 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-base font-black text-amber-400 w-16 text-right">
                        {rankItem.points} <span className="text-xs text-slate-400">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 4: LÍDERES DE NAÇÃO */}
          {activeTab === 'nationLeaders' && (
            nationLeadersList.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">Nenhum líder de nação pontuado.</p>
            ) : (
              nationLeadersList.map((rankItem: any) => {
                const percent = Math.round((rankItem.points / maxPoints) * 100);
                const isFirst = rankItem.rank === 1;
                return (
                  <div
                    key={rankItem.item.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      isFirst
                        ? 'bg-amber-950/20 border-amber-600/40'
                        : 'bg-dark-950/80 border-dark-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div
                        className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md ${
                          isFirst ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-300'
                        }`}
                      >
                        {rankItem.rank}º
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-100">{rankItem.item.name}</h4>
                          {rankItem.isTied && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              Empate
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {rankItem.item.nation?.name}
                        </span>
                      </div>
                    </div>

                    <div className="w-full sm:w-56 flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden border border-dark-800">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-base font-black text-amber-400 w-16 text-right">
                        {rankItem.points} <span className="text-xs text-slate-400">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

        </div>

      </div>

    </div>
  );
}
