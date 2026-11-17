'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Award, 
  PlusCircle, 
  History, 
  Calendar, 
  Search, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface LeadersViewProps {
  people: any[];
  onOpenScoreModalForLeader: (leaderId: string) => void;
  onRefresh: () => void;
}

export default function LeadersView({
  people,
  onOpenScoreModalForLeader,
  onRefresh,
}: LeadersViewProps) {
  const [filterRole, setFilterRole] = useState<'all' | 'lider_tribo' | 'lider_nacao'>('all');
  const [search, setSearch] = useState('');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [leaderHistory, setLeaderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal para lançamento rápido
  const [quickLaunchLeader, setQuickLaunchLeader] = useState<any | null>(null);
  const [points, setPoints] = useState<number | ''>(50);
  const [reason, setReason] = useState('');
  const [scoreDate, setScoreDate] = useState('');
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchSuccess, setLaunchSuccess] = useState<string | null>(null);

  const leaders = people.filter(
    (p) => p.role === 'lider_tribo' || p.role === 'lider_nacao'
  );

  const filteredLeaders = leaders.filter((l) => {
    if (filterRole !== 'all' && l.role !== filterRole) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Carregar histórico individual do líder
  const fetchLeaderHistory = async (leaderId: string) => {
    if (selectedLeaderId === leaderId) {
      setSelectedLeaderId(null);
      return;
    }
    setSelectedLeaderId(leaderId);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?type=leader`);
      const data = await res.json();
      if (res.ok) {
        // Filtrar apenas lançamentos deste líder
        const filtered = (data.history || []).filter(
          (h: any) => h.type === 'leader' && h.targetName === leaders.find((l) => l.id === leaderId)?.name
        );
        setLeaderHistory(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenQuickLaunch = (leader: any) => {
    setQuickLaunchLeader(leader);
    setPoints(50);
    setReason('');
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScoreDate(localIso);
    setLaunchError(null);
    setLaunchSuccess(null);
  };

  const handleSubmitQuickLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setLaunchError('O motivo do lançamento é obrigatório (mínimo 3 caracteres)');
      return;
    }
    if (!points || Number(points) <= 0) {
      setLaunchError('A quantidade de pontos deve ser um número positivo');
      return;
    }

    setLaunchLoading(true);
    setLaunchError(null);
    try {
      const res = await fetch('/api/scores/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: quickLaunchLeader.id,
          points: Number(points),
          reason: reason.trim(),
          scoreDate: scoreDate ? new Date(scoreDate).toISOString() : new Date().toISOString(),
          idempotencyKey: `quick-ld-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao lançar pontos de líder');
      }

      setLaunchSuccess('Pontos registrados com sucesso!');
      setTimeout(() => {
        setQuickLaunchLeader(null);
        onRefresh();
        if (selectedLeaderId === quickLaunchLeader.id) {
          fetchLeaderHistory(quickLaunchLeader.id);
        }
      }, 800);
    } catch (err: any) {
      setLaunchError(err.message || 'Erro inesperado');
    } finally {
      setLaunchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center space-x-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Painel de Liderança do Rali</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lançamento manual de pontos com motivo obrigatório e histórico individual
          </p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar líder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos os Líderes' },
            { id: 'lider_nacao', label: 'Líderes de Nação' },
            { id: 'lider_tribo', label: 'Líderes de Tribo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterRole(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterRole === tab.id
                  ? 'bg-amber-500 text-dark-950 border-amber-500 shadow-md'
                  : 'bg-dark-950 text-slate-400 border-dark-800 hover:border-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Líderes */}
      <div className="space-y-4">
        {filteredLeaders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-dark-900 border border-dark-800 rounded-2xl">
            Nenhum líder cadastrado com os filtros informados.
          </div>
        ) : (
          filteredLeaders.map((leader) => {
            const isNation = leader.role === 'lider_nacao';
            const isExpanded = selectedLeaderId === leader.id;

            return (
              <div
                key={leader.id}
                className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl transition-all"
              >
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-md ${
                        isNation
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      }`}
                    >
                      {isNation ? <Award className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-100">{leader.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isNation
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {isNation ? 'Líder de Nação' : 'Líder de Tribo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {leader.tribe?.name} • {leader.nation?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => fetchLeaderHistory(leader.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-dark-950 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-slate-300 transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-amber-500" />
                      <span>Histórico</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenQuickLaunch(leader)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Pontuar Líder</span>
                    </button>
                  </div>
                </div>

                {/* Histórico Individual Expandido */}
                {isExpanded && (
                  <div className="p-5 bg-dark-950 border-t border-dark-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                        <History className="w-4 h-4 text-amber-500" />
                        <span>Histórico de Pontuações de {leader.name}</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {leaderHistory.length} lançamento(s) registrado(s)
                      </span>
                    </div>

                    {loadingHistory ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Carregando histórico...</p>
                    ) : leaderHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">
                        Nenhum ponto manual registrado para este líder ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {leaderHistory.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              item.status === 'VOIDED'
                                ? 'bg-red-950/20 border-red-900/40 opacity-60'
                                : 'bg-dark-900 border-dark-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-200">{item.reason}</span>
                                {item.status === 'VOIDED' && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-900/50 text-red-300 font-bold">
                                    Estornado
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(item.scoreDate).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                • Semana {item.weekNumber}
                              </span>
                            </div>

                            <span
                              className={`text-sm font-black ${
                                item.status === 'VOIDED'
                                  ? 'line-through text-slate-500'
                                  : 'text-amber-400'
                              }`}
                            >
                              +{item.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE LANÇAMENTO RÁPIDO PARA LÍDER */}
      {quickLaunchLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Pontuar Líder</h3>
                  <p className="text-xs text-amber-400 font-semibold">{quickLaunchLeader.name}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickLaunchLeader(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {launchError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{launchError}</span>
              </div>
            )}
            {launchSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{launchSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitQuickLaunch} className="mt-4 space-y-3.5">
              
              <div className="p-3 bg-dark-950 rounded-xl border border-dark-800 text-xs text-slate-400">
                Lançamento manual independente. Pontua exclusivamente no ranking de{' '}
                <strong>
                  {quickLaunchLeader.role === 'lider_nacao' ? 'Líderes de Nação' : 'Líderes de Tribo'}
                </strong>
                . Não altera o placar de tribo ou nação.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pontos <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data e Hora <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scoreDate}
                    onChange={(e) => setScoreDate(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo Obrigatório <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Líder destaque no acolhimento de jovens"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={launchLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {launchLoading ? 'Registrando...' : 'Confirmar Pontos do Líder'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
