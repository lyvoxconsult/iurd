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
        
        {/* Barra Superior */}
        <div className="flex items-center justify-between gap-2 h-14 sm:min-h-20 py-1.5 sm:py-2">
          
          {/* Logo e Identificação */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="w-4 h-4 sm:w-7 sm:h-7 text-slate-100 font-bold" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-xl font-black tracking-tight sm:tracking-wider text-slate-100 whitespace-nowrap">
                  IURD <span className="text-amber-700">Umarizal</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                  {rallyName || 'Rali 2026'}
                </span>
                {/* Chip compacto no mobile */}
                <span className={`sm:hidden text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isPartialWeek ? 'bg-amber-950/80 text-amber-800 border border-amber-600/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {isSaturday ? 'Sábado' : isPartialWeek ? 'Parcial' : 'Fechada'}
                </span>
              </div>
              <div className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">
                {rallyName || 'Rali'}
              </div>
            </div>
          </div>

          {/* Ações Rápidas do Cabeçalho */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* No mobile, o botão "Pontuar" fica no header e na bottom bar para conveniência total */}
            <button
              onClick={onOpenScoreModal}
              className="flex min-h-9 sm:min-h-11 items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Pontuar</span>
            </button>
            <button 
              onClick={onLogout} 
              aria-label="Sair da administração" 
              title="Sair" 
              className="flex min-h-9 sm:min-h-11 min-w-9 sm:min-w-11 items-center justify-center rounded-lg sm:rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

        </div>

        {/* Faixa de Informação de Semana (apenas tablet/desktop) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 pb-2 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
          <span>{weekFormatted || 'Semana em curso'}</span>
          <span className={`rounded-full px-2 py-0.5 font-semibold ${
            isPartialWeek ? 'bg-amber-950 text-amber-800 border border-amber-600/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {isSaturday ? 'Sábado: parcial' : statusLabel || (isPartialWeek ? 'Parcial' : 'Semana encerrada')}
          </span>
        </div>

        {/* Navegação horizontal para Desktop e Tablet (oculta no mobile para usar a Bottom Bar nativa) */}
        <nav aria-label="Seções do sistema" className="hidden sm:flex gap-1.5 overflow-x-auto pb-2 pt-1 border-t border-dark-800 snap-x scroll-smooth">
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
                    ? 'bg-amber-500 text-slate-100 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-dark-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-100' : 'text-amber-700'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
