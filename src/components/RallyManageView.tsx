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
}: RallyManageViewProps) {
  // Rali Form
  const [isCreating, setIsCreating] = useState(false);
  const [newRallyName, setNewRallyName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Handlers de Rali
  const handleCreateRally = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRally) {
      setErrorMsg('Encerre o rali ativo antes de iniciar outro');
      return;
    }
    if (!newRallyName.trim() || newRallyName.trim().length < 3) {
      setErrorMsg('O nome do rali deve ter no mínimo 3 caracteres');
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
      if (!res.ok) throw new Error(data.error || 'Erro ao criar novo rali');

      setSuccessMsg('Novo rali iniciado com sucesso! O histórico anterior foi preservado.');
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

  const handleActivateRally = async (rallyId: string) => {
    if (activeRally) {
      setErrorMsg('Encerre o rali ativo antes de ativar outro');
      return;
    }
    if (!confirm('Deseja ativar este rali? Ele passará a ser o rali corrente.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', rallyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao ativar rali');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRally = async (rallyId: string) => {
    if (!confirm('Tem certeza que deseja encerrar o rali ativo?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', rallyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar rali');
    } finally {
      setLoading(false);
    }
  };

  // Handlers de Nação
  const handleOpenEditNation = (nation: any) => {
    setEditingNation(nation);
    setNationName(nation.name);
    setNationColor(displayNationColor(nation.color));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveNation = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setEditingTribe(tribe);
    setTribeName(tribe.name);
    setTribeCode(tribe.code || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveTribe = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-700" />
            <span>Gestão e Estrutura do Rali</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuração de Nações, Tribos, início, encerramento e múltiplos ciclos de rali
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          disabled={!!activeRally}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreating ? 'Fechar Formulário' : 'Iniciar Novo Rali'}</span>
        </button>
      </div>

      {activeRally && <p className="text-xs text-slate-400">O rali atual continua até você clicar em Encerrar Rali Ativo. Depois, poderá iniciar ou reativar outro.</p>}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEÇÃO: ESTRUTURA DO RALI (NAÇÕES E TRIBOS) */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Flag className="w-5 h-5 text-amber-700" />
              <span>Nações e Tribos do Rali</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Duas nações com seis tribos cada. Você pode atualizar os nomes sem alterar a estrutura.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {nations.map((nation) => {
            const nationTribes = tribes.filter((t) => t.nationId === nation.id);
            const isJuda = nation.name.includes('Judá');

            return (
              <div
                key={nation.id}
                className="bg-dark-950/80 border border-dark-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho da Nação */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-dark-800 mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: displayNationColor(nation.color) }}
                      />
                      <div>
                        <h4 className="text-base font-black text-slate-100">{nation.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {nationTribes.length} tribo(s) vinculada(s)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEditNation(nation)}
                      className="min-h-11 flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-dark-700 bg-dark-900 hover:bg-dark-800 text-slate-300 text-xs font-semibold transition-all hover:text-amber-700"
                      title="Editar Nome da Nação"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Renomear</span>
                    </button>
                  </div>

                  {/* Lista de Tribos da Nação */}
                  <div className="space-y-2 mb-4">
                    {nationTribes.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Nenhuma tribo cadastrada nesta nação.
                      </p>
                    ) : (
                      nationTribes.map((tribe) => (
                        <div
                          key={tribe.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900 border border-dark-800 hover:border-dark-700 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                            <span className="text-xs font-bold text-slate-200">{tribe.name}</span>
                            {tribe.code && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-950 border border-dark-700 text-slate-400 uppercase font-mono">
                                {tribe.code}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEditTribe(tribe)}
                              className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-amber-700 hover:bg-dark-950 rounded-lg transition-colors"
                              aria-label={`Editar ${tribe.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Rali Ativo Atual */}
      {activeRally && (
        <div className="bg-gradient-to-br from-amber-950/30 via-dark-900 to-dark-950 border border-amber-600/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-100 uppercase tracking-wider inline-block mb-1.5">
                Rali Ativo em Andamento
              </span>
              <h3 className="text-xl font-black text-slate-100">{activeRally.name}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Início: {new Date(activeRally.startDate).toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>

            <button
              onClick={() => handleCloseRally(activeRally.id)}
              className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Encerrar Rali Ativo</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-dark-800">
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Nações</span>
              <span className="text-lg font-black text-amber-700">{nations.length}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Tribos</span>
              <span className="text-lg font-black text-amber-700">{tribes.length}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Integrantes</span>
              <span className="text-lg font-black text-amber-700">{activeRally._count?.people || 0}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Lançamentos</span>
              <span className="text-lg font-black text-amber-700">{activeRally._count?.scoreLaunches || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulário para Novo Rali */}
      {isCreating && !activeRally && (
        <div className="bg-dark-900 border border-amber-600/40 rounded-2xl p-6 shadow-2xl space-y-4 gold-glow">
          <div className="flex items-center space-x-2 pb-2 border-b border-dark-800">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-100">Criar Novo Ciclo de Rali</h3>
          </div>

          <p className="text-xs text-slate-300">
            O novo rali começa sem data de encerramento. Ele termina apenas quando você clicar em Encerrar Rali Ativo. As 2 nações e as 12 tribos padrão são criadas automaticamente.
          </p>

          <form onSubmit={handleCreateRally} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Rali <span className="text-amber-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rali Umarizal 2026"
                  value={newRallyName}
                  onChange={(e) => setNewRallyName(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Inicializando...' : 'Confirmar e Iniciar Novo Rali'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Histórico de Todos os Ralis */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Ralis Cadastrados no Sistema</h3>

        <div className="space-y-3">
          {allRallies.map((rally) => (
            <div
              key={rally.id}
              className="p-4 rounded-xl border bg-dark-950/80 border-dark-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-100">{rally.name}</h4>
                  {rally.isActive ? (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/40">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-dark-900 text-slate-400 border border-dark-700">
                      Encerrado / Arquivado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Iniciado em: {new Date(rally.startDate).toLocaleDateString('pt-BR')}
                  {rally.endDate && ` • Encerrado em: ${new Date(rally.endDate).toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              {!rally.isActive && !activeRally && (
                <button
                  onClick={() => handleActivateRally(rally.id)}
                  className="px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-900 hover:bg-amber-500 hover:text-slate-100 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tornar Ativo</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: EDITAR NAÇÃO */}
      {editingNation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar nação"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-sm overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            {/* Barra de puxar no mobile (Bottom Sheet handle) */}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={nationColor}
                      onChange={(e) => setNationColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-dark-950 border border-dark-700 shrink-0"
                    />
                    <input
                      type="text"
                      value={nationColor}
                      onChange={(e) => setNationColor(e.target.value)}
                      className="flex-1 min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingNation(null)}
                  className="min-h-11 px-3.5 py-2 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR TRIBO */}
      {editingTribe && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar tribo"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-sm overflow-y-auto bg-dark-900 border border-dark-700/80 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            {/* Barra de puxar no mobile (Bottom Sheet handle) */}
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-slate-100">
                  Editar Tribo
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingTribe(null);
                }}
                aria-label="Fechar edição da tribo"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTribe} className="mt-3 sm:mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Tribo <span className="text-amber-700">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tribo Leão, Tribo Guerreiros..."
                    value={tribeName}
                    onChange={(e) => setTribeName(e.target.value)}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código da Tribo (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LEAO, GUERR..."
                    value={tribeCode}
                    onChange={(e) => setTribeCode(e.target.value)}
                    className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTribe(null);
                  }}
                  className="min-h-11 px-3.5 py-2 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Salvando...' : 'Salvar Tribo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
