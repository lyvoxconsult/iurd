import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const VIEWPORTS = {
  mobile_320: { width: 320, height: 640, name: 'mobile_320' },
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
      name: 'Rally Umarizal 2026',
      startDate: '2026-11-01T03:00:00.000Z',
      endDate: null,
      isActive: true,
      createdAt: '2026-11-01T03:00:00.000Z',
      updatedAt: '2026-11-01T03:00:00.000Z',
    },
    allRallies: [
      {
        id: 'rally_active_01',
        name: 'Rally Umarizal 2026',
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
    { id: 'p1', name: 'Pastor Marcos Silva', nationId: 'nation_juda', tribeId: 't_leao', category: 'obreiro', role: 'lider_nacao', active: true, nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p2', name: 'Pastor Daniel Souza', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'obreiro', role: 'lider_nacao', active: true, nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
    { id: 'p3', name: 'Lucas Ferreira', nationId: 'nation_juda', tribeId: 't_leao', category: 'jovem', role: 'lider_tribo', active: true, nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p4', name: 'Gabriel Santos', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'jovem', role: 'lider_tribo', active: true, nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
    { id: 'p5', name: 'Matheus Oliveira', nationId: 'nation_juda', tribeId: 't_leao', category: 'jovem', role: 'participante', active: true, nation: { name: 'Nação Judá' }, tribe: { name: 'Tribo Leão' } },
    { id: 'p6', name: 'Ana Carolina', nationId: 'nation_benjamim', tribeId: 't_aguia', category: 'jovem', role: 'participante', active: false, nation: { name: 'Nação Benjamim' }, tribe: { name: 'Tribo Águia' } },
  ],
  challenges: [
    { id: 'c1', title: 'Evangelismo de Sábado', description: 'Levar 5 convidados para a reunião especial', defaultPoints: 20 },
    { id: 'c2', title: 'Alimentos para Doação', description: 'Cesta básica arrecadada para caridade', defaultPoints: 50 },
    { id: 'c3', title: 'Jejuar e Orar no Encontro', description: 'Pontualidade e presença em peso no templo', defaultPoints: 15 },
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
  const outDir = path.resolve('auditoria-mobile', 'screenshots', 'roles-audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  console.log(`Iniciando captura de auditoria visual em: ${outDir}`);

  const browser = await chromium.launch({ headless: true });
  const appUrl = 'http://localhost:3005';

  const setupMockRoutes = async (page: any, role: 'ADMIN' | 'LEADER' | 'unauth') => {
    await page.route('**/api/auth/session', (route: any) => {
      if (role === 'unauth') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, leaderConfigured: true, authenticated: false }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, leaderConfigured: true, authenticated: true, role }) });
    });
    await page.route('**/api/rally', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA.rally) })
    );
    await page.route('**/api/nations', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nations: MOCK_DATA.nations }) })
    );
    await page.route('**/api/tribes', (route: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tribes: MOCK_DATA.tribes }) })
    );
    await page.route('**/api/people*', (route: any) =>
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

  // 1. CAPTURA DA TELA DE LOGIN (UNAUTH)
  console.log('1. Capturando telas de Login...');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await setupMockRoutes(page, 'unauth');
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    
    // Login com ADM selecionado
    await page.screenshot({ path: path.join(outDir, '01_login_adm_selected.png'), fullPage: false });

    // Clicar em Líder
    await page.getByRole('button', { name: /Líder/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '02_login_lider_selected.png'), fullPage: false });

    await ctx.close();
  }

  // 2. CAPTURA DO FLUXO ADM (390px)
  console.log('2. Capturando telas de ADM...');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await setupMockRoutes(page, 'ADMIN');
    await page.goto(appUrl, { waitUntil: 'networkidle' });

    // 03_adm_dashboard
    await page.screenshot({ path: path.join(outDir, '03_adm_dashboard.png'), fullPage: false });

    // 04_adm_desafios
    await page.getByRole('button', { name: /Desafios/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '04_adm_desafios.png'), fullPage: false });

    // 05_adm_integrantes
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Integrantes")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '05_adm_integrantes.png'), fullPage: false });

    // 06_adm_lideres
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Líderes")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '06_adm_lideres.png'), fullPage: false });

    // 07_adm_historico
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Histórico")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '07_adm_historico.png'), fullPage: false });

    // 08_adm_gestao_rally
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Gestão Rally")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '08_adm_gestao_rally.png'), fullPage: false });

    await ctx.close();
  }

  // 3. CAPTURA DO FLUXO LÍDER (390px)
  console.log('3. Capturando telas de Líder...');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await setupMockRoutes(page, 'LEADER');
    await page.goto(appUrl, { waitUntil: 'networkidle' });

    // 09_lider_dashboard
    await page.screenshot({ path: path.join(outDir, '09_lider_dashboard.png'), fullPage: false });

    // 10_lider_desafios (veja botão Compartilhar proeminente e ausência de criar desafio)
    await page.getByRole('button', { name: /Desafios/i }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '10_lider_desafios.png'), fullPage: false });

    // 11_lider_integrantes (veja botões de editar e remover disponíveis para Líder)
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Integrantes")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '11_lider_integrantes.png'), fullPage: false });

    // Clicar em Remover de um integrante para abrir o bottom sheet de confirmação
    const removeBtn = page.locator('button:has-text("Remover")').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, '12_lider_modal_remover_integrante.png'), fullPage: false });
      // Cancelar remoção
      await page.locator('button:has-text("Cancelar")').last().click();
      await page.waitForTimeout(300);
    }

    // 13_lider_lideres (veja ausência de botão Pontuar Líder)
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Líderes")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '13_lider_lideres.png'), fullPage: false });

    // 14_lider_historico (veja ausência de botão Estornar)
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Histórico")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '14_lider_historico.png'), fullPage: false });

    // 15_lider_gestao_rally (veja modo Somente Leitura)
    await page.getByLabel('Mais opções e configurações').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Gestão Rally")').last().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '15_lider_gestao_rally.png'), fullPage: false });

    // A ação central do Líder leva a Integrantes, sem abrir o formulário de pontuação.
    await page.getByRole('button', { name: 'Ver integrantes' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, '16_lider_acao_integrantes.png'), fullPage: false });

    await ctx.close();
  }

  // 4. RESPONSIVIDADE MULTI-VIEWPORT (320px, 360px, 430px, 768px, 1280px)
  console.log('4. Capturando responsividade multi-viewport...');
  for (const [key, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await setupMockRoutes(page, 'ADMIN');
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `resp_${vp.name}_dashboard.png`), fullPage: false });
    await ctx.close();
  }

  for (const width of [320, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await ctx.newPage();
    await setupMockRoutes(page, 'LEADER');
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `resp_mobile_${width}_leader_dashboard.png`), fullPage: false });
    await ctx.close();
  }

  await browser.close();
  console.log('Todas as capturas de auditoria visual concluídas com sucesso!');
}

main().catch(console.error);
