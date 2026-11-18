import { chromium } from 'playwright';
import * as path from 'path';

const VIEWPORTS = {
  mobile_360: { width: 360, height: 780, name: 'android_360' },
  mobile_390: { width: 390, height: 844, name: 'iphone_390' },
  mobile_430: { width: 430, height: 932, name: 'iphone_430' },
  tablet_768: { width: 768, height: 1024, name: 'ipad_768' },
  desktop_1280: { width: 1280, height: 800, name: 'desktop_1280' },
};

const MOCK_DATA = {
  rally: {
    activeRally: {
      id: 'rally_active_01',
      name: 'Rali Umarizal 2026',
      startDate: '2026-11-01T03:00:00.000Z',
      endDate: null,
      isActive: true,
      createdAt: '2026-11-01T03:00:00.000Z',
      updatedAt: '2026-11-01T03:00:00.000Z',
    },
    allRallies: [
      {
        id: 'rally_active_01',
        name: 'Rali Umarizal 2026',
        startDate: '2026-11-01T03:00:00.000Z',
        endDate: null,
        isActive: true,
      },
    ],
  },
  nations: [
    { id: 'nation_juda', name: 'Nação Judá', color: '#f59e0b', orderIndex: 1 },
    { id: 'nation_benjamim', name: 'Nação Benjamim', color: '#0ea5e9', orderIndex: 2 },
  ],
  tribes: [
    { id: 't_leao', name: 'Tribo Leão', nationId: 'nation_juda', nation: { name: 'Nação Judá' } },
    { id: 't_guerreiros', name: 'Tribo Guerreiros', nationId: 'nation_juda', nation: { name: 'Nação Judá' } },
    { id: 't_vencedores', name: 'Tribo Vencedores', nationId: 'nation_juda', nation: { name: 'Nação Judá' } },
    { id: 't_aguia', name: 'Tribo Águia', nationId: 'nation_benjamim', nation: { name: 'Nação Benjamim' } },
    { id: 't_valentes', name: 'Tribo Valentes', nationId: 'nation_benjamim', nation: { name: 'Nação Benjamim' } },
    { id: 't_sentinela', name: 'Tribo Sentinela', nationId: 'nation_benjamim', nation: { name: 'Nação Benjamim' } },
  ],
  people: [
    { id: 'p1', name: 'Pastor Marcos Silva', nationId: 'nation_juda', tribeId: 't_leao', category: 'obreiro', role: 'lider_nacao', nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p2', name: 'Pastor Daniel Souza', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'obreiro', role: 'lider_nacao', nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
    { id: 'p3', name: 'Lucas Ferreira', nationId: 'nation_juda', tribeId: 't_leao', category: 'jovem', role: 'lider_tribo', nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p4', name: 'Gabriel Santos', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'jovem', role: 'lider_tribo', nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
    { id: 'p5', name: 'Matheus Oliveira', nationId: 'nation_juda', tribeId: 't_leao', category: 'jovem', role: 'participante', nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p6', name: 'Ana Carolina', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'jovem', role: 'participante', nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
  ],
  challenges: [
    { id: 'c1', title: 'Evangelismo de Sábado', description: 'Levar 5 convidados para a reunião especial', defaultPoints: 20 },
    { id: 'c2', title: 'Alimentos para Doação', description: 'Cesta básica arrecadada', defaultPoints: 50 },
    { id: 'c3', title: 'Jejuar e Orar no Encontro', description: 'Pontualidade e presença em peso', defaultPoints: 15 },
  ],
  weeklyRankings: {
    period: 'week',
    currentWeekInfo: {
      weekNumber: 47,
      weekYear: 2026,
      formattedRange: '16/11/2026 a 22/11/2026',
      isPartial: true,
      isSaturday: false,
      statusLabel: 'Semana em Andamento (Parcial)',
    },
    targetWeek: { weekNumber: 47, weekYear: 2026 },
    availableWeeks: [{ weekNumber: 47, weekYear: 2026 }],
    nations: [
      { item: { id: 'nation_juda', name: 'Nação Judá', color: '#f59e0b' }, points: 145, rank: 1, isTied: false },
      { item: { id: 'nation_benjamim', name: 'Nação Benjamim', color: '#0ea5e9' }, points: 120, rank: 2, isTied: false },
    ],
    tribes: [
      { item: { id: 't_leao', name: 'Tribo Leão', nation: { name: 'Nação Judá' } }, points: 85, rank: 1, isTied: false },
      { item: { id: 't_aguia', name: 'Tribo Águia', nation: { name: 'Nação Benjamim' } }, points: 70, rank: 2, isTied: false },
      { item: { id: 't_guerreiros', name: 'Tribo Guerreiros', nation: { name: 'Nação Judá' } }, points: 60, rank: 3, isTied: false },
    ],
    tribeLeaders: [
      { item: { id: 'p3', name: 'Lucas Ferreira', tribe: { name: 'Tribo Leão' }, nation: { name: 'Nação Judá' } }, points: 50, rank: 1, isTied: false },
      { item: { id: 'p4', name: 'Gabriel Santos', tribe: { name: 'Tribo Águia' }, nation: { name: 'Nação Benjamim' } }, points: 40, rank: 2, isTied: false },
    ],
    nationLeaders: [
      { item: { id: 'p1', name: 'Pastor Marcos Silva', tribe: { name: 'Tribo Leão' }, nation: { name: 'Nação Judá' } }, points: 60, rank: 1, isTied: false },
      { item: { id: 'p2', name: 'Pastor Daniel Souza', tribe: { name: 'Tribo Águia' }, nation: { name: 'Nação Benjamim' } }, points: 50, rank: 2, isTied: false },
    ],
  },
  accumulatedRankings: {
    period: 'total',
    nations: [
      { item: { id: 'nation_juda', name: 'Nação Judá', color: '#f59e0b' }, points: 480, rank: 1, isTied: false },
      { item: { id: 'nation_benjamim', name: 'Nação Benjamim', color: '#0ea5e9' }, points: 440, rank: 2, isTied: false },
    ],
  },
  history: [
    {
      id: 'h1',
      type: 'challenge',
      title: 'Evangelismo de Sábado',
      points: 20,
      targetType: 'tribe',
      targetName: 'Tribo Leão',
      nationName: 'Nação Judá',
      scoreDate: '2026-11-17T15:30:00.000Z',
      weekNumber: 47,
      weekYear: 2026,
      status: 'ACTIVE',
    },
    {
      id: 'h2',
      type: 'leader',
      title: 'Líder Destaque da Semana',
      points: 50,
      targetType: 'person',
      targetName: 'Lucas Ferreira',
      nationName: 'Nação Judá',
      scoreDate: '2026-11-17T18:00:00.000Z',
      weekNumber: 47,
      weekYear: 2026,
      status: 'ACTIVE',
      reason: 'Excelente engajamento e pontualidade da equipe',
    },
  ],
};

async function main() {
  const targetDir = process.argv[2] || 'before';
  const outDir = path.resolve('auditoria-mobile', 'screenshots', targetDir);
  console.log(`Iniciando captura de screenshots em: ${outDir}`);

  const browser = await chromium.launch({ headless: true });

  const setupMockRoutes = async (page: any) => {
    await page.route('**/api/auth/session', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, authenticated: true }) })
    );
    await page.route('**/api/rally', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA.rally) })
    );
    await page.route('**/api/nations', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nations: MOCK_DATA.nations }) })
    );
    await page.route('**/api/tribes', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tribes: MOCK_DATA.tribes }) })
    );
    await page.route('**/api/people', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ people: MOCK_DATA.people }) })
    );
    await page.route('**/api/challenges', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ challenges: MOCK_DATA.challenges }) })
    );
    await page.route('**/api/rankings?period=week*', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA.weeklyRankings) })
    );
    await page.route('**/api/rankings?period=total*', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA.accumulatedRankings) })
    );
    await page.route('**/api/history*', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: MOCK_DATA.history }) })
    );
  };

  const appUrl = 'http://localhost:3005';

  // Capturar em 390px (iPhone padrão) todas as abas
  const vp390 = VIEWPORTS.mobile_390;
  const context390 = await browser.newContext({ viewport: { width: vp390.width, height: vp390.height } });
  const page390 = await context390.newPage();
  await setupMockRoutes(page390);

  await page390.goto(appUrl, { waitUntil: 'networkidle' });
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_01_dashboard.png`), fullPage: false });

  // Abrir Modal de Pontuação
  await page390.locator('button[aria-label="Lançar pontuação no rali"], button:has-text("Pontuar"), button:has-text("Lançar pontos")').first().click();
  await page390.waitForTimeout(500);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_02_modal_pontuar_desafio.png`), fullPage: false });

  // Trocar para aba Pontos de Líder no modal
  await page390.getByRole('button', { name: /Pontos de Líder/i }).click();
  await page390.waitForTimeout(300);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_03_modal_pontuar_lider.png`), fullPage: false });

  // Fechar Modal
  await page390.getByLabel('Fechar lançamento').click();
  await page390.waitForTimeout(300);

  // Navegar para Rankings
  await page390.getByRole('button', { name: /Rankings/i }).first().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_04_rankings.png`), fullPage: false });

  // Navegar para Integrantes (via menu Mais)
  await page390.getByLabel('Mais opções e configurações').click();
  await page390.waitForTimeout(300);
  await page390.locator('button:has-text("Integrantes")').last().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_05_integrantes.png`), fullPage: false });

  // Abrir Modal de Novo Integrante
  await page390.getByRole('button', { name: /Novo Integrante|Cadastrar/i }).first().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_06_modal_novo_integrante.png`), fullPage: false });
  await page390.getByLabel('Fechar cadastro').click();
  await page390.waitForTimeout(300);

  // Navegar para Desafios (via bottom bar)
  await page390.getByRole('button', { name: /Desafios/i }).first().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_07_desafios.png`), fullPage: false });

  // Navegar para Líderes (via menu Mais)
  await page390.getByLabel('Mais opções e configurações').click();
  await page390.waitForTimeout(300);
  await page390.locator('button:has-text("Líderes")').last().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_08_lideres.png`), fullPage: false });

  // Navegar para Histórico (via menu Mais)
  await page390.getByLabel('Mais opções e configurações').click();
  await page390.waitForTimeout(300);
  await page390.locator('button:has-text("Histórico")').last().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_09_historico.png`), fullPage: false });

  // Navegar para Gestão Rali (via menu Mais)
  await page390.getByLabel('Mais opções e configurações').click();
  await page390.waitForTimeout(300);
  await page390.locator('button:has-text("Gestão Rali")').last().click();
  await page390.waitForTimeout(400);
  await page390.screenshot({ path: path.join(outDir, `${vp390.name}_10_gestao_rali.png`), fullPage: false });

  await context390.close();

  // Capturar Dashboard em 360px (Android menor)
  const vp360 = VIEWPORTS.mobile_360;
  const context360 = await browser.newContext({ viewport: { width: vp360.width, height: vp360.height } });
  const page360 = await context360.newPage();
  await setupMockRoutes(page360);
  await page360.goto(appUrl, { waitUntil: 'networkidle' });
  await page360.screenshot({ path: path.join(outDir, `${vp360.name}_dashboard.png`), fullPage: false });
  await context360.close();

  // Capturar Dashboard em 430px (iPhone Pro Max)
  const vp430 = VIEWPORTS.mobile_430;
  const context430 = await browser.newContext({ viewport: { width: vp430.width, height: vp430.height } });
  const page430 = await context430.newPage();
  await setupMockRoutes(page430);
  await page430.goto(appUrl, { waitUntil: 'networkidle' });
  await page430.screenshot({ path: path.join(outDir, `${vp430.name}_dashboard.png`), fullPage: false });
  await context430.close();

  // Capturar Dashboard em Tablet 768px
  const vp768 = VIEWPORTS.tablet_768;
  const context768 = await browser.newContext({ viewport: { width: vp768.width, height: vp768.height } });
  const page768 = await context768.newPage();
  await setupMockRoutes(page768);
  await page768.goto(appUrl, { waitUntil: 'networkidle' });
  await page768.screenshot({ path: path.join(outDir, `${vp768.name}_dashboard.png`), fullPage: false });
  await context768.close();

  // Capturar Dashboard em Desktop 1280px
  const vp1280 = VIEWPORTS.desktop_1280;
  const context1280 = await browser.newContext({ viewport: { width: vp1280.width, height: vp1280.height } });
  const page1280 = await context1280.newPage();
  await setupMockRoutes(page1280);
  await page1280.goto(appUrl, { waitUntil: 'networkidle' });
  await page1280.screenshot({ path: path.join(outDir, `${vp1280.name}_dashboard.png`), fullPage: false });
  await context1280.close();

  await browser.close();
  console.log('Capturas concluídas com sucesso!');
}

main().catch(console.error);
