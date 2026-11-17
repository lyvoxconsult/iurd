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

  // Carregar dados principais
  const loadData = useCallback(async () => {
    try {
      // 1. Rali
      const rallyRes = await fetch('/api/rally');
      const rallyData = await rallyRes.json();
      setActiveRally(rallyData.activeRally || null);
      setAllRallies(rallyData.allRallies || []);

      // 2. Nações e Tribos
      const nationsRes = await fetch('/api/nations');
      const nationsData = await nationsRes.json();
      setNations(nationsData.nations || []);

      const tribesRes = await fetch('/api/tribes');
      const tribesData = await tribesRes.json();
      setTribes(tribesData.tribes || []);

      // 3. Pessoas
      const peopleRes = await fetch('/api/people');
      const peopleData = await peopleRes.json();
      setPeople(peopleData.people || []);

      // 4. Desafios
      const challengesRes = await fetch('/api/challenges');
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

      const weeklyJson = await weeklyRes.json();
      const totalJson = await totalRes.json();

      setWeeklyRankings(weeklyJson);
      setAccumulatedRankings(totalJson);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [modalInitialTitle, setModalInitialTitle] = useState('');
  const [modalInitialLeaderId, setModalInitialLeaderId] = useState('');

  const handleLaunchChallengeFromView = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    setModalInitialTitle(ch?.title || '');
    setModalInitialLeaderId('');
    setIsScoreModalOpen(true);
  };

  const handleScoreModalForLeader = (leaderId: string) => {
    setModalInitialTitle('');
    setModalInitialLeaderId(leaderId);
    setIsScoreModalOpen(true);
  };

  const currentWeekInfo = weeklyRankings?.currentWeekInfo;

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col">
      
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenScoreModal={() => setIsScoreModalOpen(true)}
        rallyName={activeRally?.name || 'Rali Umarizal'}
        isPartialWeek={currentWeekInfo?.isPartial ?? true}
        isSaturday={currentWeekInfo?.isSaturday ?? false}
        weekFormatted={currentWeekInfo?.formattedRange || ''}
        statusLabel={currentWeekInfo?.statusLabel || ''}
        isSundayAfter16h={currentWeekInfo?.isSundayAfter16h ?? false}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Carregando sistema IURD Umarizal...</p>
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
          setModalInitialLeaderId('');
        }}
        onSuccess={loadData}
        challenges={challenges}
        nations={nations}
        tribes={tribes}
        people={people}
        initialChallengeTitle={modalInitialTitle}
        initialLeaderId={modalInitialLeaderId}
      />

      {/* Rodapé Oficial */}
      <footer className="bg-dark-900 border-t border-dark-800 py-6 text-center text-xs text-slate-500">
        <p>
          Sistema Oficial de Pontuação do Rali • <strong>IURD Umarizal</strong>
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Operação no fuso horário America/Sao_Paulo • Semanas de Segunda a Domingo
        </p>
      </footer>

    </div>
  );
}
