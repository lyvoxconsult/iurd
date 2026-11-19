'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  PlusCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Square,
  RotateCcw,
  Sparkles,
  Edit2,
  Shield,
  X,
  Users,
  Flag
} from 'lucide-react';

interface RallyManageViewProps {
  activeRally: any;
  allRallies: any[];
  nations: any[];
  tribes: any[];
  onRefresh: () => void;
  userRole?: 'ADMIN' | 'LEADER' | null;
}

function displayNationColor(color?: string) {
  if (color?.toLowerCase() === '#f59e0b') return '#b9923f';
  if (color?.toLowerCase() === '#0ea5e9') return '#2f6fa8';
  return color || '#b9923f';
}

export default function RallyManageView({
  activeRally,
  allRallies,
  nations,
  tribes,
  onRefresh,
  userRole,
}: RallyManageViewProps) {
  // Rally Form
  const [isCreating, setIsCreating] = useState(false);
  const [newRallyName, setNewRallyName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab de Nação no mobile para economizar rolagem vertical
  const [mobileNationTab, setMobileNationTab] = useState<string>('');

  useEffect(() => {
    if (nations.length > 0 && !mobileNationTab) {
      setMobileNationTab(nations[0].id);
    }
  }, [nations, mobileNationTab]);

  // Modal: Editar Nação
  const [editingNation, setEditingNation] = useState<any | null>(null);
  const [nationName, setNationName] = useState('');
  const [nationColor, setNationColor] = useState('');

  // Modal: Editar Tribo
  const [editingTribe, setEditingTribe] = useState<any | null>(null);
  const [tribeName, setTribeName] = useState('');
  const [tribeCode, setTribeCode] = useState('');

  // Fechar modals ao pressionar Escape
  useEffect(() => {
    if (!editingNation && !editingTribe) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingNation(null);
        setEditingTribe(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingNation, editingTribe]);

  // Handlers de Rally
  const handleCreateRally = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'LEADER') {
      setErrorMsg('Apenas administradores podem iniciar novo Rally');
      return;
    }
    if (activeRally) {
      setErrorMsg('Encerre o Rally ativo antes de iniciar outro');
      return;
    }
    if (!newRallyName.trim() || newRallyName.trim().length < 3) {
      setErrorMsg('O nome do Rally deve ter no mínimo 3 caracteres');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRallyName.trim(),
          startDate: newStartDate ? new Date(newStartDate).toISOString() : new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar novo Rally');

      setSuccessMsg('Novo Rally iniciado com sucesso! O histórico anterior foi preservado.');
      setNewRallyName('');
      setNewStartDate('');
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRally = async (id: string) => {
    if (userRole === 'LEADER') {
      setErrorMsg('Apenas administradores podem encerrar o Rally ativo');
      return;
    }
    if (!confirm('Deseja realmente encerrar o Rally ativo? O placar final será consolidado e os dados preservados.')) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao encerrar Rally');

      setSuccessMsg('Rally encerrado com sucesso! Você pode iniciar um novo Rally a qualquer momento.');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateRally = async (id: string) => {
    if (userRole === 'LEADER') {
      setErrorMsg('Apenas administradores podem reativar um Rally');
      return;
    }
    if (activeRally) {
      setErrorMsg('Encerre o Rally ativo antes de reativar outro');
      return;
    }
    if (!confirm('Deseja reativar este Rally anterior?')) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reativar Rally');

      setSuccessMsg('Rally reativado com sucesso!');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de Nação
  const handleOpenEditNation = (nation: any) => {
    if (userRole === 'LEADER') return;
    setEditingNation(nation);
    setNationName(nation.name);
    setNationColor(nation.color || '#b9923f');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveNation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'LEADER') return;
    if (!nationName.trim() || nationName.trim().length < 2) {
      setErrorMsg('Informe um nome válido para a nação');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/nations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNation.id,
          name: nationName.trim(),
          color: nationColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg('Nação atualizada com sucesso!');
      setEditingNation(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar nação');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de Tribo
  const handleOpenEditTribe = (tribe: any) => {
    if (userRole === 'LEADER') return;
    setEditingTribe(tribe);
    setTribeName(tribe.name);
    setTribeCode(tribe.code || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveTribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'LEADER') return;
    if (!tribeName.trim() || tribeName.trim().length < 2) {
      setErrorMsg('Informe um nome válido para a tribo');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tribes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTribe.id,
          name: tribeName.trim(),
          code: tribeCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Tribo atualizada com sucesso!');
      setEditingTribe(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar tribo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-6">

      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-700" />
            <span>Gestão e Estrutura do Rally</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {userRole === 'LEADER'
              ? 'Visualização da estrutura de Nações, Tribos e status do ciclo ativo do Rally.'
              : 'Configuração de Nações, Tribos, início, encerramento e ciclos de Rally.'}
          </p>
        </div>

        {/* Botão Novo Rally exclusivo para ADM */}
        {userRole !== 'LEADER' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            disabled={!!activeRally}
            className="w-full sm:w-auto min-h-11 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? 'Fechar Formulário' : 'Iniciar Novo Rally'}</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEÇÃO 1: RALLY ATIVO EM ANDAMENTO (Destaque Principal) */}
      {activeRally ? (
        <div className="bg-gradient-to-br from-amber-950/20 via-dark-900 to-dark-950 border border-amber-600/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-100 uppercase tracking-wider inline-block mb-1">
                Rally Ativo
              </span>
              <h3 className="text-base sm:text-xl font-black text-slate-100">{activeRally.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Início: {new Date(activeRally.startDate).toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>

            {userRole !== 'LEADER' && (
              <button
                onClick={() => handleCloseRally(activeRally.id)}
                className="w-full sm:w-auto min-h-10 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Encerrar Rally Ativo</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-dark-800">
            <div className="p-2.5 sm:p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Nações</span>
              <span className="text-base sm:text-lg font-black text-amber-700">{nations.length}</span>
            </div>
            <div className="p-2.5 sm:p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Tribos</span>
              <span className="text-base sm:text-lg font-black text-amber-700">{tribes.length}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 text-slate-400 text-xs text-center">
          Nenhum Rally ativo no momento. {userRole !== 'LEADER' && 'Inicie um novo Rally para começar.'}
        </div>
      )}

      {/* Formulário para Novo Rally (Apenas ADM) */}
      {isCreating && !activeRally && userRole !== 'LEADER' && (
        <div className="bg-dark-900 border border-amber-600/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3.5 gold-glow">
          <div className="flex items-center space-x-2 pb-2 border-b border-dark-800">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-100">Criar Novo Ciclo de Rally</h3>
          </div>

          <p className="text-xs text-slate-300">
            O novo Rally começa sem data de encerramento. Ele termina apenas quando você clicar em Encerrar Rally Ativo. As 2 nações e as 12 tribos padrão são criadas automaticamente.
          </p>

          <form onSubmit={handleCreateRally} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Rally <span className="text-amber-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rally Umarizal 2026"
                  value={newRallyName}
                  onChange={(e) => setNewRallyName(e.target.value)}
                  className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="min-h-10 px-4 py-2 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-10 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Iniciando...' : 'Iniciar Rally'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEÇÃO 2: ESTRUTURA DO RALLY (NAÇÕES E TRIBOS) */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3.5 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-3 border-b border-dark-800 gap-1.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center space-x-2">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              <span>Nações e Tribos do Rally</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Duas nações com seis tribos cada vinculadas à disputa.
            </p>
          </div>
        </div>

        {/* Seletor Segmentado de Nação no Mobile para evitar rolagem excessiva */}
        <div className="grid grid-cols-2 sm:hidden gap-1.5 p-1 bg-dark-950 rounded-xl border border-dark-800">
          {nations.map((nation) => {
            const isSelected = mobileNationTab === nation.id;
            return (
              <button
                key={nation.id}
                type="button"
                onClick={() => setMobileNationTab(nation.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-100 shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: displayNationColor(nation.color) }}
                />
                <span className="truncate">{nation.name}</span>
              </button>
            );
          })}
        </div>

        {/* Grid de Nações (Tabs no Mobile, 2 Colunas no Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
          {nations.map((nation) => {
            const nationTribes = tribes.filter((t) => t.nationId === nation.id);
            const isHiddenOnMobile = mobileNationTab && mobileNationTab !== nation.id;

            return (
              <div
                key={nation.id}
                className={`bg-dark-950/80 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-lg flex flex-col justify-between ${
                  isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
                }`}
              >
                <div>
                  {/* Cabeçalho da Nação */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-dark-800 mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                      <div
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: displayNationColor(nation.color) }}
                      />
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-slate-100">{nation.name}</h4>
                        <span className="text-[10px] sm:text-[11px] text-slate-400">
                          {nationTribes.length} tribo(s) vinculada(s)
                        </span>
                      </div>
                    </div>

                    {userRole !== 'LEADER' && (
                      <button
                        onClick={() => handleOpenEditNation(nation)}
                        className="min-h-9 flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-dark-700 bg-dark-900 hover:bg-dark-800 text-slate-300 text-xs font-semibold transition-all hover:text-amber-700"
                        title="Editar Nome da Nação"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Renomear</span>
                      </button>
                    )}
                  </div>

                  {/* Lista Compacta de Tribos da Nação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mb-2">
                    {nationTribes.length === 0 ? (
                      <p className="col-span-full text-xs text-slate-500 py-3 text-center">
                        Nenhuma tribo cadastrada nesta nação.
                      </p>
                    ) : (
                      nationTribes.map((tribe) => (
                        <div
                          key={tribe.id}
                          className="flex items-center justify-between p-2 rounded-lg sm:rounded-xl bg-dark-900 border border-dark-800/80 hover:border-dark-700 transition-colors"
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />
                            <span className="text-xs font-bold text-slate-200 truncate">{tribe.name}</span>
                            {tribe.code && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-dark-950 border border-dark-700 text-slate-400 uppercase font-mono shrink-0">
                                {tribe.code}
                              </span>
                            )}
                          </div>

                          {userRole !== 'LEADER' && (
                            <button
                              onClick={() => handleOpenEditTribe(tribe)}
                              className="min-h-8 min-w-8 flex items-center justify-center text-slate-400 hover:text-amber-700 hover:bg-dark-950 rounded-lg transition-colors shrink-0"
                              aria-label={`Editar ${tribe.name}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 3: HISTÓRICO DE CICLOS DE RALLY */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-200">Ciclos de Rally Cadastrados</h3>

        <div className="space-y-2">
          {allRallies.map((rally) => (
            <div
              key={rally.id}
              className="p-3 rounded-xl border bg-dark-950/80 border-dark-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">{rally.name}</h4>
                  {rally.isActive ? (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/40">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-dark-900 text-slate-400 border border-dark-700">
                      Encerrado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Início: {new Date(rally.startDate).toLocaleDateString('pt-BR')}
                  {rally.endDate && ` • Fim: ${new Date(rally.endDate).toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              {!rally.isActive && !activeRally && userRole !== 'LEADER' && (
                <button
                  onClick={() => handleActivateRally(rally.id)}
                  className="min-h-9 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-900 hover:bg-amber-500 hover:text-slate-100 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tornar Ativo</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: EDITAR NAÇÃO (Exclusivo ADM) */}
      {editingNation && userRole !== 'LEADER' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar nação"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-sm overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-slate-100">Editar Nação</h3>
              </div>
              <button
                onClick={() => setEditingNation(null)}
                aria-label="Fechar edição da nação"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNation} className="mt-3 sm:mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Nação <span className="text-amber-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={nationName}
                    onChange={(e) => setNationName(e.target.value)}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingNation(null)}
                  className="min-h-11 flex-1 py-2.5 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TRIBO (Exclusivo ADM) */}
      {editingTribe && userRole !== 'LEADER' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar tribo"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-sm overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-slate-100">Editar Tribo</h3>
              </div>
              <button
                onClick={() => setEditingTribe(null)}
                aria-label="Fechar edição da tribo"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTribe} className="mt-3 sm:mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Tribo <span className="text-amber-700">*</span>
                  </label>
                  <input
                    type="text"
                    value={tribeName}
                    onChange={(e) => setTribeName(e.target.value)}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código / Sigla (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ex: LEA"
                    value={tribeCode}
                    onChange={(e) => setTribeCode(e.target.value.toUpperCase())}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTribe(null)}
                  className="min-h-11 flex-1 py-2.5 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
