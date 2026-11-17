'use client';

import React, { useState, useEffect } from 'react';
import { X, Award, Flame, Crown, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  challenges: any[];
  nations: any[];
  tribes: any[];
  people: any[];
}

export default function ScoreModal({
  isOpen,
  onClose,
  onSuccess,
  challenges,
  nations,
  tribes,
  people,
}: ScoreModalProps) {
  const [modalTab, setModalTab] = useState<'challenge' | 'leader'>('challenge');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Challenge Form State
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [targetType, setTargetType] = useState<'nation' | 'tribe' | 'person'>('nation');
  const [targetId, setTargetId] = useState('');
  const [points, setPoints] = useState<number | ''>(10);
  const [scoreDate, setScoreDate] = useState('');
  const [notes, setNotes] = useState('');

  // Leader Form State
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [leaderPoints, setLeaderPoints] = useState<number | ''>(50);
  const [leaderReason, setLeaderReason] = useState('');
  const [leaderScoreDate, setLeaderScoreDate] = useState('');

  // Set default dates on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Format YYYY-MM-DDTHH:mm
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScoreDate(localIso);
      setLeaderScoreDate(localIso);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (challenges.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(challenges[0].id);
        setPoints(challenges[0].defaultPoints || 10);
      }

      if (nations.length > 0 && !targetId) {
        setTargetId(nations[0].id);
      }
    }
  }, [isOpen, challenges, nations]);

  // Update points when challenge changes
  const handleChallengeChange = (cId: string) => {
    setSelectedChallengeId(cId);
    const found = challenges.find((c) => c.id === cId);
    if (found) {
      setPoints(found.defaultPoints);
    }
  };

  // Switch target type and default target ID
  const handleTargetTypeChange = (type: 'nation' | 'tribe' | 'person') => {
    setTargetType(type);
    if (type === 'nation' && nations.length > 0) {
      setTargetId(nations[0].id);
    } else if (type === 'tribe' && tribes.length > 0) {
      setTargetId(tribes[0].id);
    } else if (type === 'person' && people.length > 0) {
      setTargetId(people[0].id);
    } else {
      setTargetId('');
    }
  };

  const leadersOnly = people.filter(
    (p) => p.role === 'lider_tribo' || p.role === 'lider_nacao'
  );

  const handleSubmitChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedChallengeId) {
      setErrorMsg('Selecione um desafio');
      return;
    }
    if (!targetId) {
      setErrorMsg('Selecione o alvo da pontuação');
      return;
    }
    if (!points || Number(points) <= 0) {
      setErrorMsg('Informe uma quantidade de pontos positiva');
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `ch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch('/api/scores/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallengeId,
          targetType,
          targetId,
          points: Number(points),
          scoreDate: scoreDate ? new Date(scoreDate).toISOString() : new Date().toISOString(),
          notes: notes || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao lançar pontuação de desafio');
      }

      setSuccessMsg('Pontuação lançada com sucesso no placar!');
      setNotes('');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedLeaderId) {
      setErrorMsg('Selecione um líder');
      return;
    }
    if (!leaderPoints || Number(leaderPoints) <= 0) {
      setErrorMsg('Informe uma quantidade de pontos positiva');
      return;
    }
    if (!leaderReason || leaderReason.trim().length < 3) {
      setErrorMsg('O motivo do lançamento é obrigatório (mínimo 3 caracteres)');
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = `ld-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch('/api/scores/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId: selectedLeaderId,
          points: Number(leaderPoints),
          reason: leaderReason.trim(),
          scoreDate: leaderScoreDate ? new Date(leaderScoreDate).toISOString() : new Date().toISOString(),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao lançar pontos de líder');
      }

      setSuccessMsg('Pontuação manual de líder registrada no ranking individual!');
      setLeaderReason('');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl p-6 my-8">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              {modalTab === 'challenge' ? <Flame className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Lançar Pontuação</h2>
              <p className="text-xs text-slate-400">Rali IURD U Marizal • Registro Oficial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas do Modal */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-dark-950 rounded-xl border border-dark-800">
          <button
            type="button"
            onClick={() => {
              setModalTab('challenge');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              modalTab === 'challenge'
                ? 'bg-amber-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Desafio do Rali</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModalTab('leader');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
              modalTab === 'leader'
                ? 'bg-amber-500 text-dark-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Pontos de Líder</span>
          </button>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulário 1: Desafio */}
        {modalTab === 'challenge' && (
          <form onSubmit={handleSubmitChallenge} className="mt-4 space-y-4">
            
            {/* Escolher Desafio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Desafio <span className="text-amber-500">*</span>
              </label>
              <select
                value={selectedChallengeId}
                onChange={(e) => handleChallengeChange(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                required
              >
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.defaultPoints} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Alvo: Nação / Tribo / Pessoa */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alvo da Pontuação <span className="text-amber-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'nation', label: 'Nação' },
                  { id: 'tribe', label: 'Tribo' },
                  { id: 'person', label: 'Pessoa' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTargetTypeChange(t.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      targetType === t.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-dark-950 border-dark-800 text-slate-400 hover:border-dark-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selecionar Alvo Específico */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {targetType === 'nation'
                  ? 'Selecione a Nação'
                  : targetType === 'tribe'
                  ? 'Selecione a Tribo'
                  : 'Selecione o Integrante'}{' '}
                <span className="text-amber-500">*</span>
              </label>

              {targetType === 'nation' && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                >
                  {nations.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              )}

              {targetType === 'tribe' && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                >
                  {tribes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.nation?.name || 'Nação'})
                    </option>
                  ))}
                </select>
              )}

              {targetType === 'person' && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.tribe?.name} ({p.nation?.name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Regra Explicativa Visual */}
            <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-400 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                {targetType === 'nation' && (
                  <span>
                    <strong>Alvo Nação:</strong> Pontua <u>somente a nação</u> selecionada.
                  </span>
                )}
                {targetType === 'tribe' && (
                  <span>
                    <strong>Alvo Tribo:</strong> Pontua a tribo e a sua nação correspondente.
                  </span>
                )}
                {targetType === 'person' && (
                  <span>
                    <strong>Alvo Pessoa:</strong> Pontua a tribo e a nação desta pessoa. Se a pessoa for líder, não altera o ranking de líderes.
                  </span>
                )}
              </div>
            </div>

            {/* Pontos e Data */}
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

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações / Justificativa (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Culto das 19h com mobilização máxima"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Ação */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Registrando...' : 'Confirmar Lançamento de Desafio'}
              </button>
            </div>
          </form>
        )}

        {/* Formulário 2: Pontos de Líder */}
        {modalTab === 'leader' && (
          <form onSubmit={handleSubmitLeader} className="mt-4 space-y-4">
            
            {/* Escolher Líder */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selecione o Líder <span className="text-amber-500">*</span>
              </label>
              <select
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Selecione um líder --</option>
                {leadersOnly.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.role === 'lider_nacao' ? 'Líder de Nação' : 'Líder de Tribo'} ({l.nation?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Regra Explicativa de Líder */}
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 flex items-start space-x-2">
              <Crown className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Regra Exclusiva de Líderes:</strong> Esta pontuação é manual e entra{' '}
                <u>somente no ranking do líder</u>. Não altera em nenhuma hipótese o placar da tribo ou da nação.
              </div>
            </div>

            {/* Pontos e Data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pontos do Líder <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={leaderPoints}
                  onChange={(e) => setLeaderPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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
                  value={leaderScoreDate}
                  onChange={(e) => setLeaderScoreDate(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Motivo OBRIGATÓRIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo do Lançamento <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Líder mais engajado na evangelização"
                value={leaderReason}
                onChange={(e) => setLeaderReason(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Ação */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-dark-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Registrando...' : 'Confirmar Pontos do Líder'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
