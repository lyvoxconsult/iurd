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
  Calendar,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenScoreModal: () => void;
  onLogout: () => void;
  rallyName: string;
  isPartialWeek: boolean;
  isSaturday: boolean;
  weekFormatted: string;
  statusLabel?: string;
}

export default function Header({
  currentTab,
  setCurrentTab,
  onOpenScoreModal,
  onLogout,
  rallyName,
  isPartialWeek,
  isSaturday,
  weekFormatted,
  statusLabel,
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
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-md border-b border-dark-700/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-16 sm:min-h-20 py-2">
          
          {/* Logo e Informações de Contexto */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-dark-950 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-base sm:text-xl font-black tracking-tight sm:tracking-wider text-slate-100 whitespace-nowrap">
                  IURD <span className="text-amber-500">Umarizal</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {rallyName || 'Rali 2026'}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">{rallyName || 'Rali'}</div>
            </div>
          </div>

          {/* Botão de Lançar Pontos */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onOpenScoreModal}
              className="flex min-h-11 items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Lançar Pontuação</span>
              <span className="sm:hidden">Pontuar</span>
            </button>
            <button onClick={onLogout} aria-label="Sair da administração" title="Sair" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"><LogOut className="h-4 w-4" /></button>
          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2 pb-2 text-[11px] sm:text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{weekFormatted || 'Semana em curso'}</span>
          <span className={`rounded-full px-2 py-0.5 font-semibold ${isPartialWeek ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>{isSaturday ? 'Sábado: parcial' : statusLabel || (isPartialWeek ? 'Parcial' : 'Semana encerrada')}</span>
        </div>
        {/* Navegação horizontal para telas pequenas. */}
        <nav aria-label="Seções do sistema" className="flex gap-1.5 overflow-x-auto pb-2 pt-1 border-t border-dark-800 snap-x scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 snap-start items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
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
