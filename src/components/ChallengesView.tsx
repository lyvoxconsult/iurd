'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  AlertCircle, 
  Sparkles, 
  Plus,
  ArrowRight,
  Share2,
  Download
} from 'lucide-react';
import { createChallengeImage } from '@/lib/challenge-card';

interface Challenge {
  id: string;
  title: string;
  description?: string | null;
  defaultPoints: number;
  _count?: { scoreLaunches: number };
}

interface ChallengesViewProps {
  challenges: Challenge[];
  onRefresh: () => void;
  onLaunchChallenge: (challengeId: string) => void;
  userRole?: 'ADMIN' | 'LEADER' | null;
}

export default function ChallengesView({
  challenges,
  onRefresh,
  onLaunchChallenge,
  userRole,
}: ChallengesViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPoints, setDefaultPoints] = useState<number | ''>(10);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<{ id: string; message: string; showFallback: boolean } | null>(null);

  const shareText = (challenge: Challenge) =>
    `Desafio do Rally: ${challenge.title} — ${challenge.defaultPoints} pontos${challenge.description ? `\n${challenge.description}` : ''}`;

  const downloadImage = (challenge: Challenge, existingFile?: File) => {
    const file = existingFile || createChallengeImage({ title: challenge.title, description: challenge.description, points: challenge.defaultPoints });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleShareChallenge = async (challenge: Challenge) => {
    setSharingId(challenge.id);
    setShareNotice(null);
    try {
      const file = createChallengeImage({ title: challenge.title, description: challenge.description, points: challenge.defaultPoints });
      const files = [file];
      let canShareFile = false;
      try {
        canShareFile = typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' && navigator.canShare({ files });
      } catch {
        canShareFile = false;
      }
      if (canShareFile) {
        try {
          await navigator.share({ files, title: challenge.title, text: shareText(challenge) });
          setShareNotice({ id: challenge.id, message: 'Imagem enviada para o aplicativo escolhido.', showFallback: false });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setShareNotice({ id: challenge.id, message: 'Não foi possível compartilhar diretamente. Baixe a imagem e envie-a no WhatsApp.', showFallback: true });
        }
      } else {
        downloadImage(challenge, file);
        setShareNotice({ id: challenge.id, message: 'Imagem baixada. Abra o WhatsApp e envie o cartão gerado.', showFallback: true });
      }
    } catch (error) {
      setShareNotice({ id: challenge.id, message: error instanceof Error ? error.message : 'Não foi possível gerar a imagem.', showFallback: false });
    } finally {
      setSharingId(null);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'LEADER') {
      setErrorMsg('Apenas administradores podem criar desafios.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('O título deve ter no mínimo 3 caracteres');
      return;
    }
    if (!defaultPoints || Number(defaultPoints) <= 0) {
      setErrorMsg('Informe uma quantidade de pontos positiva');
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
      if (!res.ok) throw new Error(data.error || 'Erro ao criar desafio');

      setSuccessMsg('Desafio criado com sucesso! Agora você pode compartilhar ou pontuar.');
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
    <div className="space-y-3.5 sm:space-y-6">
      
      {/* Cabeçalho */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-700" />
            <span>Desafios e Missões do Rally</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {userRole === 'LEADER'
              ? 'Visualize os desafios do Rally e gere imagens oficiais para compartilhar com a sua equipe.'
              : 'Crie o desafio, compartilhe a imagem e pontue depois quando ele for concluído.'}
          </p>
        </div>

        {/* Botão de Criação exclusivo para ADM */}
        {userRole !== 'LEADER' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Fechar Formulário' : 'Criar Novo Desafio'}</span>
          </button>
        )}
      </div>

      {successMsg && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm text-emerald-800">{successMsg}</p>}

      {/* Formulário de Criação (Apenas ADM) */}
      {isCreating && userRole !== 'LEADER' && (
        <div className="bg-dark-900 border border-amber-600/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 gold-glow">
          <div className="flex items-center space-x-2 pb-2 border-b border-dark-800">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-100">Configurar Novo Desafio</h3>
          </div>

          {errorMsg && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateChallenge} className="space-y-3 sm:space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Desafio <span className="text-amber-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Evangelismo de Sábado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pontos Padrão <span className="text-amber-700">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={defaultPoints}
                  onChange={(e) => setDefaultPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full min-h-11 bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
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
                className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-2.5 sm:space-x-3 pt-2">
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
                {loading ? 'Salvando...' : 'Salvar sem Pontuar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Desafios Existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {challenges.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-dark-900 border border-dark-800 rounded-2xl">
            Nenhum desafio cadastrado no Rally.
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-dark-900 border border-dark-800 hover:border-amber-600/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>+{challenge.defaultPoints} pts</span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">
                  {challenge.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-3 sm:mb-4">
                  {challenge.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-2.5 sm:pt-3 border-t border-dark-800/80 space-y-2.5">
                <span className="text-[11px] text-slate-400 font-medium">
                  {challenge._count?.scoreLaunches || 0} lançamento(s)
                </span>

                {userRole === 'LEADER' ? (
                  /* Modo Líder: Botão único de Compartilhar em destaque total */
                  <div>
                    <button
                      type="button"
                      onClick={() => handleShareChallenge(challenge)}
                      disabled={sharingId === challenge.id}
                      className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                      aria-label={`Compartilhar imagem do desafio ${challenge.title}`}
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>{sharingId === challenge.id ? 'Gerando cartão...' : 'Compartilhar Desafio'}</span>
                    </button>
                  </div>
                ) : (
                  /* Modo ADM: Grid com Compartilhar e Pontuar */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareChallenge(challenge)}
                      disabled={sharingId === challenge.id}
                      className="min-h-11 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-100 text-xs sm:text-sm font-bold transition-all disabled:opacity-60"
                      aria-label={`Compartilhar imagem do desafio ${challenge.title}`}
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span>{sharingId === challenge.id ? 'Abrindo...' : 'Compartilhar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onLaunchChallenge(challenge.id)}
                      className="min-h-11 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-dark-950 hover:bg-amber-500 hover:text-slate-100 text-amber-700 border border-amber-500/30 text-xs sm:text-sm font-bold transition-all"
                      aria-label={`Pontuar o desafio ${challenge.title}`}
                    >
                      <span>Pontuar</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                )}

                {shareNotice && shareNotice.id === challenge.id && (
                  <div role="status" className="space-y-1.5 text-xs text-slate-300 bg-dark-950/80 p-2.5 rounded-xl border border-dark-800">
                    <p>{shareNotice.message}</p>
                    {shareNotice.showFallback && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button type="button" onClick={() => {
                          try {
                            downloadImage(challenge);
                          } catch (error) {
                            setShareNotice({ id: challenge.id, message: error instanceof Error ? error.message : 'Não foi possível baixar a imagem.', showFallback: false });
                          }
                        }} className="min-h-9 inline-flex items-center gap-1 text-amber-800 underline underline-offset-2 font-semibold">
                          <Download className="w-3.5 h-3.5" /> Baixar imagem
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareText(challenge))}`} target="_blank" rel="noopener noreferrer" className="min-h-9 inline-flex items-center text-amber-800 underline underline-offset-2 font-semibold">
                          Abrir WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
