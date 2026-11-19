'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Filter, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Ban, 
  Flame, 
  Crown, 
  ArrowRight,
  Info,
  X
} from 'lucide-react';

interface HistoryViewProps {
  onRefresh: () => void;
  availableWeeks: any[];
  userRole?: 'ADMIN' | 'LEADER' | null;
}

export default function HistoryView({
  onRefresh,
  availableWeeks,
  userRole,
}: HistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'challenge' | 'leader'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'VOIDED'>('all');
  const [filterWeek, setFilterWeek] = useState<string>('');

  // Modal de Estorno / Correção
  const [voidModalItem, setVoidModalItem] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidSuccess, setVoidSuccess] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterWeek) {
        const [year, num] = filterWeek.split('-');
        params.append('weekYear', year);
        params.append('weekNumber', num);
      }

      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistoryItems(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType, filterStatus, filterWeek]);

  // Fechar modal ao pressionar Escape
  useEffect(() => {
    if (!voidModalItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVoidModalItem(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [voidModalItem]);

  const handleOpenVoidModal = (item: any) => {
    setVoidModalItem(item);
    setVoidReason('');
    setVoidError(null);
    setVoidSuccess(null);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason || voidReason.trim().length < 3) {
      setVoidError('O motivo da anulação/estorno é obrigatório (mínimo 3 caracteres)');
      return;
    }

    setVoidLoading(true);
    setVoidError(null);
    try {
      const res = await fetch('/api/scores/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          launchType: voidModalItem.type,
          launchId: voidModalItem.id,
          reason: voidReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao anular lançamento');
      }

      setVoidSuccess('Lançamento estornado com sucesso! A trilha histórica foi preservada.');
      setTimeout(() => {
        setVoidModalItem(null);
        fetchHistory();
        onRefresh();
      }, 1000);
    } catch (err: any) {
      setVoidError(err.message || 'Erro inesperado');
    } finally {
      setVoidLoading(false);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-6">
      
      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-700" />
            <span>Auditoria e Histórico de Pontuação do Rally</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {userRole === 'LEADER'
              ? 'Conferência detalhada e rastreabilidade dos lançamentos de desafios e líderes por semana.'
              : 'Rastreabilidade completa, conferência por semana e correções auditadas sem deleção física.'}
          </p>
        </div>
      </div>

      {/* Barra de Filtros Compacta */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 sm:space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Filtro por Tipo */}
          <div className="grid grid-cols-3 bg-dark-950 p-1 rounded-xl border border-dark-800">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'challenge', label: 'Desafios' },
              { id: 'leader', label: 'Líderes' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  filterType === t.id
                    ? 'bg-amber-500 text-slate-100 shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filtro por Status */}
          <div className="grid grid-cols-3 bg-dark-950 p-1 rounded-xl border border-dark-800">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'ACTIVE', label: 'Ativos' },
              { id: 'VOIDED', label: 'Estornados' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id as any)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                  filterStatus === s.id
                    ? 'bg-amber-500 text-slate-100 shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Semana */}
        {availableWeeks.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-dark-800/80">
            <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Semana:</span>
            </span>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full sm:w-auto bg-dark-950 border border-dark-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 min-h-10"
            >
              <option value="">Todas as Semanas</option>
              {availableWeeks.map((w: any) => (
                <option key={`${w.weekYear}-${w.weekNumber}`} value={`${w.weekYear}-${w.weekNumber}`}>
                  Semana {w.weekNumber} ({w.weekYear})
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Lista de Histórico / Timeline */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl space-y-2.5 sm:space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Carregando histórico auditado...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          historyItems.map((item) => {
            const isVoided = item.status === 'VOIDED';
            const isLeader = item.type === 'leader';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                  isVoided
                    ? 'bg-red-50 border-red-200 opacity-75'
                    : 'bg-dark-950/80 border-dark-800 hover:border-dark-700'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md ${
                      isVoided
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : isLeader
                        ? 'bg-sky-500/20 text-sky-700 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
                    }`}
                  >
                    {isVoided ? (
                      <Ban className="w-5 h-5 text-red-800" />
                    ) : isLeader ? (
                      <Crown className="w-5 h-5 text-sky-700" />
                    ) : (
                      <Flame className="w-5 h-5 text-amber-700" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isVoided ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {isVoided && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-800">
                          Estornado
                        </span>
                      )}
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-dark-900 border border-dark-700 text-slate-400">
                        Semana {item.weekNumber}
                      </span>
                    </div>

                    {/* Explicação da origem e benefício */}
                    <p className="text-xs text-slate-400 mt-1">
                      {isLeader ? (
                        <span>
                          Pontuou <strong>{item.targetName}</strong> ({item.leaderRole}) • {item.beneficiaryNation}
                        </span>
                      ) : (
                        <span>
                          Alvo: <strong>{item.targetName}</strong> ({item.targetType}) • Pontuou nação{' '}
                          <strong className="text-amber-700">{item.beneficiaryNation}</strong>
                          {item.beneficiaryTribe && (
                            <>
                              {' '}
                              e tribo <strong className="text-sky-700">{item.beneficiaryTribe}</strong>
                            </>
                          )}
                        </span>
                      )}
                    </p>

                    {item.notes && !isVoided && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        Obs: &quot;{item.notes}&quot;
                      </p>
                    )}

                    {isVoided && item.voidReason && (
                      <p className="text-[11px] text-red-800/90 font-medium mt-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                        <strong>Motivo do Estorno:</strong> {item.voidReason}
                      </p>
                    )}

                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(item.scoreDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                  <span
                    className={`text-base font-black ${
                      isVoided ? 'line-through text-slate-600' : 'text-amber-700'
                    }`}
                  >
                    +{item.points} pts
                  </span>

                  {!isVoided && userRole !== 'LEADER' && (
                    <button
                      onClick={() => handleOpenVoidModal(item)}
                      className="min-h-9 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold flex items-center space-x-1 transition-all"
                      title="Estornar lançamento com justificativa"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Estornar</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE ESTORNO */}
      {voidModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Estornar pontuação"
            className="relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-md overflow-y-auto bg-dark-900 border border-red-200 rounded-t-[28px] sm:rounded-2xl shadow-2xl p-4 pb-6 sm:p-6 focus:outline-none flex flex-col"
          >
            {/* Barra de puxar no mobile (Bottom Sheet handle) */}
            <div className="sm:hidden w-12 h-1 bg-dark-600 rounded-full mx-auto mb-2.5 shrink-0" />

            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-dark-800">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 text-red-800 flex items-center justify-center border border-red-200 shrink-0">
                  <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">Estorno de Lançamento</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Correção auditada sem perda de histórico</p>
                </div>
              </div>
              <button
                onClick={() => setVoidModalItem(null)}
                aria-label="Fechar modal de estorno"
                className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {voidError && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
                <span>{voidError}</span>
              </div>
            )}
            {voidSuccess && (
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                <span>{voidSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmVoid} className="mt-3 sm:mt-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-2.5 sm:p-3 bg-dark-950 rounded-xl border border-dark-800 text-xs text-slate-300">
                  Você está estornando: <strong>{voidModalItem.title}</strong> (+{voidModalItem.points} pts).
                  O lançamento será invalidado nos rankings, mantendo a trilha registrada.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motivo Obrigatório da Correção / Estorno <span className="text-red-800">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Pontuação lançada em duplicidade ou alvo incorreto..."
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm pt-3 pb-1 -mx-1 px-1 border-t border-dark-800/60 mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setVoidModalItem(null)}
                  className="min-h-11 px-4 py-2 rounded-xl border border-dark-700 text-slate-300 hover:bg-dark-800 text-xs font-semibold flex items-center justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={voidLoading}
                  className="min-h-11 px-5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {voidLoading ? 'Processando...' : 'Confirmar Estorno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
