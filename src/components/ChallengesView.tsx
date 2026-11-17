'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus,
  ArrowRight
} from 'lucide-react';

interface ChallengesViewProps {
  challenges: any[];
  onRefresh: () => void;
  onLaunchChallenge: (challengeId: string) => void;
}

export default function ChallengesView({
  challenges,
  onRefresh,
  onLaunchChallenge,
}: ChallengesViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPoints, setDefaultPoints] = useState<number | ''>(10);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('O título deve ter no mínimo 3 caracteres');
      return;
    }
    if (!defaultPoints || Number(defaultPoints) <= 0) {
      setErrorMsg('Os pontos devem ser um número inteiro positivo');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          defaultPoints: Number(defaultPoints),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar desafio');
      }

      setSuccessMsg('Desafio criado com sucesso!');
      setTitle('');
      setDescription('');
      setDefaultPoints(10);
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
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
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Desafios e Missões do Rali</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Criação de desafios e pontuação para Nações, Tribos e Integrantes
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="min-h-11 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Fechar Formulário' : 'Criar Novo Desafio'}</span>
        </button>
      </div>

      {/* Formulário de Criação (Toggle) */}
      {isCreating && (
        <div className="bg-dark-900 border border-amber-600/40 rounded-2xl p-6 shadow-2xl space-y-4 gold-glow">
          <div className="flex items-center space-x-2 pb-2 border-b border-dark-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-100">Configurar Novo Desafio</h3>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateChallenge} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Desafio <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Evangelismo de Sábado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pontos Padrão <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={defaultPoints}
                  onChange={(e) => setDefaultPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição e Regras da Missão (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Presença mínima de 5 jovens no ponto de oração..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
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
                {loading ? 'Salvando...' : 'Salvar Desafio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Desafios Existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-dark-900 border border-dark-800 rounded-2xl">
            Nenhum desafio cadastrado. Crie um desafio para começar.
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-dark-900 border border-dark-800 hover:border-amber-600/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <Flame className="w-4 h-4" />
                  </span>
                  <span className="text-base font-black text-amber-400">
                    {challenge.defaultPoints} <span className="text-xs text-slate-400">pts</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-1">
                  {challenge.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-4">
                  {challenge.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-3 border-t border-dark-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {challenge._count?.scoreLaunches || 0} lançamentos
                </span>
                <button
                  onClick={() => onLaunchChallenge(challenge.id)}
                  className="min-h-11 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-950 hover:bg-amber-500 hover:text-dark-950 text-amber-400 border border-amber-500/30 text-sm font-bold transition-all"
                >
                  <span>Pontuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
