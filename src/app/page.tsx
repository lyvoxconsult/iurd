'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ScoreModal from '@/components/ScoreModal';
import DashboardView from '@/components/DashboardView';
import RankingsView from '@/components/RankingsView';
import PeopleView from '@/components/PeopleView';
import ChallengesView from '@/components/ChallengesView';
import LeadersView from '@/components/LeadersView';
import HistoryView from '@/components/HistoryView';
import RallyManageView from '@/components/RallyManageView';

export default function HomePage() {
  const [session, setSession] = useState<'checking' | 'setup' | 'locked' | 'ready'>('checking');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Dados globais
  const [activeRally, setActiveRally] = useState<any | null>(null);
  const [allRallies, setAllRallies] = useState<any[]>([]);
  const [nations, setNations] = useState<any[]>([]);
  const [tribes, setTribes] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);

  // Rankings
  const [rankingPeriod, setRankingPeriod] = useState<'week' | 'total'>('week');
  const [selectedWeek, setSelectedWeek] = useState<{ weekNumber: number; weekYear: number } | null>(null);
  const [weeklyRankings, setWeeklyRankings] = useState<any | null>(null);
  const [accumulatedRankings, setAccumulatedRankings] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível verificar o acesso.');
        const data = await res.json();
        setSession(!data.configured ? 'setup' : data.authenticated ? 'ready' : 'locked');
      })
      .catch(() => { setAuthError('Não foi possível verificar o acesso. Tente novamente.'); setSession('locked'); });
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Senha incorreta.');
      setPassword('');
      setSession('ready');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession('locked');
    setActiveRally(null);
    setPeople([]);
    setWeeklyRankings(null);
    setAccumulatedRankings(null);
  };

  // Carregar dados principais
  const loadData = useCallback(async () => {
    if (session !== 'ready') return;
    setLoadError('');
    try {
      // 1. Rali
      const rallyRes = await fetch('/api/rally');
      if (!rallyRes.ok) throw new Error('Falha ao carregar o rali.');
      const rallyData = await rallyRes.json();
      setActiveRally(rallyData.activeRally || null);
      setAllRallies(rallyData.allRallies || []);

      // 2. Nações e Tribos
      const nationsRes = await fetch('/api/nations');
      if (!nationsRes.ok) throw new Error('Falha ao carregar as nações.');
      const nationsData = await nationsRes.json();
      setNations(nationsData.nations || []);

      const tribesRes = await fetch('/api/tribes');
      if (!tribesRes.ok) throw new Error('Falha ao carregar as tribos.');
      const tribesData = await tribesRes.json();
      setTribes(tribesData.tribes || []);

      // 3. Pessoas
      const peopleRes = await fetch('/api/people');
      if (!peopleRes.ok) throw new Error('Falha ao carregar os integrantes.');
      const peopleData = await peopleRes.json();
      setPeople(peopleData.people || []);

      // 4. Desafios
      const challengesRes = await fetch('/api/challenges');
      if (!challengesRes.ok) throw new Error('Falha ao carregar os desafios.');
      const challengesData = await challengesRes.json();
      setChallenges(challengesData.challenges || []);

      // 5. Rankings Semanal e Acumulado
      const weekParams = selectedWeek
        ? `&weekNumber=${selectedWeek.weekNumber}&weekYear=${selectedWeek.weekYear}`
        : '';
      const [weeklyRes, totalRes] = await Promise.all([
        fetch(`/api/rankings?period=week${weekParams}`),
        fetch('/api/rankings?period=total'),
      ]);
      if (!weeklyRes.ok || !totalRes.ok) throw new Error('Falha ao carregar os rankings.');

      const weeklyJson = await weeklyRes.json();
      const totalJson = await totalRes.json();

      setWeeklyRankings(weeklyJson);
      setAccumulatedRankings(totalJson);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [modalInitialTitle, setModalInitialTitle] = useState('');
  const [modalInitialChallengeId, setModalInitialChallengeId] = useState('');
  const [modalInitialLeaderId, setModalInitialLeaderId] = useState('');

  const handleLaunchChallengeFromView = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    setModalInitialTitle(ch?.title || '');
    setModalInitialChallengeId(ch?.id || '');
    setModalInitialLeaderId('');
    setIsScoreModalOpen(true);
  };

  const handleScoreModalForLeader = (leaderId: string) => {
    setModalInitialTitle('');
    setModalInitialChallengeId('');
    setModalInitialLeaderId(leaderId);
    setIsScoreModalOpen(true);
  };

  const currentWeekInfo = weeklyRankings?.currentWeekInfo;

  if (session !== 'ready') {
    return (
      <main className="min-h-dvh bg-dark-950 px-4 py-8 flex items-center justify-center text-slate-100">
        <div className="w-full max-w-sm rounded-3xl border border-dark-700 bg-dark-900 p-6 sm:p-8 shadow-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">IURD Umarizal</p>
          <h1 className="mt-3 text-2xl font-black">Gestão do rali</h1>
          {session === 'checking' ? <p className="mt-5 text-slate-300" role="status">Verificando acesso…</p> : session === 'setup' ? (
            <div className="mt-5 space-y-2 text-sm text-slate-300" role="alert">
              <p>O acesso administrativo ainda não foi configurado.</p>
              <p>Defina ADMIN_PASSWORD e SESSION_SECRET no ambiente do servidor e reinicie a aplicação.</p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label htmlFor="admin-password" className="block text-sm font-semibold">Senha de administração</label>
              <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full min-h-12 rounded-xl border border-dark-700 bg-dark-950 px-4 text-base text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400" />
              {authError && <p role="alert" className="text-sm text-red-300">{authError}</p>}
              <button type="submit" disabled={authBusy} className="w-full min-h-12 rounded-xl bg-amber-500 px-4 font-bold text-dark-950 disabled:opacity-60">{authBusy ? 'Entrando…' : 'Entrar'}</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col">
      
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScoreModal={() => setIsScoreModalOpen(true)}
        onLogout={handleLogout}
        rallyName={activeRally?.name || 'Rali Umarizal'}
        isPartialWeek={currentWeekInfo?.isPartial ?? true}
        isSaturday={currentWeekInfo?.isSaturday ?? false}
        weekFormatted={currentWeekInfo?.formattedRange || ''}
        statusLabel={currentWeekInfo?.statusLabel || ''}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Carregando IURD Umarizal...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-red-700/60 bg-red-950/40 p-6 text-center">
            <h2 className="text-lg font-bold">Não foi possível carregar os dados</h2>
            <p className="mt-2 text-sm text-red-200">{loadError}</p>
            <button onClick={loadData} className="mt-5 min-h-11 rounded-xl bg-amber-500 px-5 font-bold text-dark-950">Tentar novamente</button>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                rankingsData={weeklyRankings}
                accumulatedRankingsData={accumulatedRankings}
                onOpenScoreModal={() => setIsScoreModalOpen(true)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'rankings' && (
              <RankingsView
                rankingsData={weeklyRankings}
                accumulatedRankingsData={accumulatedRankings}
                period={rankingPeriod}
                setPeriod={setRankingPeriod}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
              />
            )}

            {currentTab === 'people' && (
              <PeopleView
                people={people}
                nations={nations}
                tribes={tribes}
                onRefresh={loadData}
              />
            )}

            {currentTab === 'challenges' && (
              <ChallengesView
                challenges={challenges}
                onRefresh={loadData}
                onLaunchChallenge={handleLaunchChallengeFromView}
              />
            )}

            {currentTab === 'leaders' && (
              <LeadersView
                people={people}
                onOpenScoreModalForLeader={handleScoreModalForLeader}
                onRefresh={loadData}
              />
            )}

            {currentTab === 'history' && (
              <HistoryView
                onRefresh={loadData}
                availableWeeks={weeklyRankings?.availableWeeks || []}
              />
            )}

            {currentTab === 'rally' && (
              <RallyManageView
                activeRally={activeRally}
                allRallies={allRallies}
                nations={nations}
                tribes={tribes}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Modal de Lançamento de Pontos */}
      <ScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false);
          setModalInitialTitle('');
          setModalInitialChallengeId('');
          setModalInitialLeaderId('');
        }}
        onSuccess={loadData}
        challenges={challenges}
        nations={nations}
        tribes={tribes}
        people={people}
        initialChallengeTitle={modalInitialTitle}
        initialChallengeId={modalInitialChallengeId}
        initialLeaderId={modalInitialLeaderId}
      />

      {/* Rodapé Oficial */}
      <footer className="bg-dark-900 border-t border-dark-800 py-6 text-center text-xs text-slate-500">
        <p>
          Sistema de Pontuação do Rali • <strong>IURD Umarizal</strong>
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Operação no fuso horário America/Sao_Paulo • Semanas de Segunda a Domingo
        </p>
      </footer>

    </div>
  );
}
