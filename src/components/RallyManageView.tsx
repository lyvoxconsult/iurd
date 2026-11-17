'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  RotateCcw,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface RallyManageViewProps {
  activeRally: any;
  allRallies: any[];
  onRefresh: () => void;
}

export default function RallyManageView({
  activeRally,
  allRallies,
  onRefresh,
}: RallyManageViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newRallyName, setNewRallyName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateRally = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar novo rali');
      }

      setSuccessMsg('Novo rali iniciado com sucesso! O histórico do rali anterior foi preservado.');
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
    if (!confirm('Deseja ativar este rali? Ele passará a ser o rali corrente.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          rallyId,
        }),
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
        body: JSON.stringify({
          action: 'close',
          rallyId,
        }),
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

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Gestão e Ciclo de Vida do Rali</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Definição de início, encerramento e preservação de histórico entre edições
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreating ? 'Fechar Formulário' : 'Iniciar Novo Rali'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulário para Novo Rali */}
      {isCreating && (
        <div className="bg-dark-900 border border-amber-600/40 rounded-2xl p-6 shadow-2xl space-y-4 gold-glow">
          <div className="flex items-center space-x-2 pb-2 border-b border-dark-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-100">Criar Novo Ciclo de Rali</h3>
          </div>

          <p className="text-xs text-slate-300">
            Ao criar um novo rali, o rali atual é arquivado no histórico com todas as suas pontuações e rankings intactos. As 2 nações e as 12 tribos padrão são inicializadas automaticamente para o novo ciclo.
          </p>

          <form onSubmit={handleCreateRally} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Rali <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rali Umarizal 2026 - Edição Inverno"
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
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Inicializando...' : 'Confirmar e Iniciar Novo Rali'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rali Ativo Atual */}
      {activeRally && (
        <div className="bg-gradient-to-br from-amber-950/30 via-dark-900 to-dark-950 border border-amber-600/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-dark-950 uppercase tracking-wider inline-block mb-1.5">
                Rali Ativo em Andamento
              </span>
              <h3 className="text-xl font-black text-slate-100">{activeRally.name}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Início: {new Date(activeRally.startDate).toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>

            <button
              onClick={() => handleCloseRally(activeRally.id)}
              className="px-3.5 py-2 rounded-xl border border-red-800 bg-red-950/40 hover:bg-red-900/60 text-red-200 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Encerrar Rali Ativo</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-dark-800">
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Nações</span>
              <span className="text-lg font-black text-amber-400">{activeRally._count?.nations || 2}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Tribos</span>
              <span className="text-lg font-black text-amber-400">{activeRally._count?.tribes || 12}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Integrantes</span>
              <span className="text-lg font-black text-amber-400">{activeRally._count?.people || 0}</span>
            </div>
            <div className="p-3 bg-dark-950/80 rounded-xl border border-dark-800">
              <span className="text-[11px] text-slate-400 block font-medium">Lançamentos</span>
              <span className="text-lg font-black text-amber-400">{activeRally._count?.scoreLaunches || 0}</span>
            </div>
          </div>
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
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
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

              {!rally.isActive && (
                <button
                  onClick={() => handleActivateRally(rally.id)}
                  className="px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-900 hover:bg-amber-500 hover:text-dark-950 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tornar Ativo</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
