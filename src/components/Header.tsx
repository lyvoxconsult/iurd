'use client';

import React from 'react';
import { 
  Trophy, 
  Users, 
  Award, 
  History, 
  Settings, 
  PlusCircle, 
  Flame, 
  Crown,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenScoreModal: () => void;
  rallyName: string;
  isPartialWeek: boolean;
  isSaturday: boolean;
  weekFormatted: string;
}

export default function Header({
  currentTab,
  setCurrentTab,
  onOpenScoreModal,
  rallyName,
  isPartialWeek,
  isSaturday,
  weekFormatted,
}: HeaderProps) {
  const tabs = [
    { id: 'dashboard', label: 'Painel Principal', icon: Trophy },
    { id: 'rankings', label: 'Rankings', icon: Award },
    { id: 'people', label: 'Integrantes', icon: Users },
    { id: 'challenges', label: 'Desafios', icon: Flame },
    { id: 'leaders', label: 'Líderes', icon: Crown },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'rally', label: 'Gestão Rali', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo e Informações de Contexto */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-7 h-7 text-dark-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-wider text-slate-100 uppercase">
                  IURD <span className="text-amber-500">UMARIZAL</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {rallyName || 'Rali 2026'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{weekFormatted || 'Semana em curso'}</span>
                {isPartialWeek && (
                  <span className="inline-flex items-center px-2 py-0.2 rounded text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-600/40 animate-pulse">
                    {isSaturday ? 'Sábado: Parcial' : 'Semana Parcial'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botão de Lançar Pontos */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenScoreModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Lançar Pontuação</span>
              <span className="sm:hidden">Pontuar</span>
            </button>
          </div>

        </div>

        {/* Barra de Navegação de Abas */}
        <nav className="flex space-x-1 overflow-x-auto pb-3 pt-1 scrollbar-none border-t border-dark-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-dark-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-dark-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
