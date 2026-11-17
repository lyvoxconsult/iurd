const http = require('http');

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- TESTANDO FLUXO COMPLETO VIA HTTP LOCALHOST:3000 ---');

  // 1. Obter Nações, Tribos, Desafios e Pessoas
  const nationsRes = await request('http://localhost:3000/api/nations');
  const juda = nationsRes.body.nations.find((n) => n.name.includes('Judá'));
  const leao = juda.tribes.find((t) => t.name.includes('Leão'));

  const challengesRes = await request('http://localhost:3000/api/challenges');
  const ch10 = challengesRes.body.challenges.find((c) => c.defaultPoints === 10);
  const ch20 = challengesRes.body.challenges.find((c) => c.defaultPoints === 20);
  const ch30 = challengesRes.body.challenges.find((c) => c.defaultPoints === 30);

  const peopleRes = await request('http://localhost:3000/api/people');
  const matheus = peopleRes.body.people.find((p) => p.name === 'Matheus Oliveira');
  const lucas = peopleRes.body.people.find((p) => p.name === 'Lucas Ferreira'); // líder de tribo

  // 2. Lançamento 1: Desafio de 10 pts para Nação Judá
  console.log('1. Lançando 10 pts para Nação Judá...');
  const l1 = await request('http://localhost:3000/api/scores/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      challengeId: ch10.id,
      targetType: 'nation',
      targetId: juda.id,
      points: 10,
    },
  });
  console.log('L1 status:', l1.status);

  // 3. Lançamento 2: Desafio de 20 pts para Tribo Leão
  console.log('2. Lançando 20 pts para Tribo Leão...');
  const l2 = await request('http://localhost:3000/api/scores/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      challengeId: ch20.id,
      targetType: 'tribe',
      targetId: leao.id,
      points: 20,
    },
  });
  console.log('L2 status:', l2.status);

  // 4. Lançamento 3: Desafio de 30 pts para Matheus Oliveira (pessoa da Tribo Leão)
  console.log('3. Lançando 30 pts para Matheus Oliveira (pessoa)...');
  const l3 = await request('http://localhost:3000/api/scores/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      challengeId: ch30.id,
      targetType: 'person',
      targetId: matheus.id,
      points: 30,
    },
  });
  console.log('L3 status:', l3.status);

  // 5. Verificar rankings parciais
  const rankRes1 = await request('http://localhost:3000/api/rankings?period=week');
  const judaRank1 = rankRes1.body.nations.find((n) => n.item.id === juda.id);
  const leaoRank1 = rankRes1.body.tribes.find((t) => t.item.id === leao.id);

  console.log(`Nação Judá pontos esperados: 60 -> Obtido: ${judaRank1.points}`);
  console.log(`Tribo Leão pontos esperados: 50 -> Obtido: ${leaoRank1.points}`);
  if (judaRank1.points !== 60 || leaoRank1.points !== 50) {
    throw new Error('Falha no cálculo após lançamentos 1, 2 e 3!');
  }

  // 6. Lançamento de 50 pontos para o Líder Lucas Ferreira
  console.log('4. Lançando manual de 50 pts para o Líder Lucas Ferreira com motivo...');
  const leaderL = await request('http://localhost:3000/api/scores/leader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      leaderId: lucas.id,
      points: 50,
      reason: 'Líder mais engajado na acolhida e pontualidade',
    },
  });
  console.log('Leader status:', leaderL.status);

  // 7. Conferir que Nação e Tribo permanecem 60 e 50, e o ranking do líder tem 50
  const rankRes2 = await request('http://localhost:3000/api/rankings?period=week');
  const judaRank2 = rankRes2.body.nations.find((n) => n.item.id === juda.id);
  const leaoRank2 = rankRes2.body.tribes.find((t) => t.item.id === leao.id);
  const lucasRank = rankRes2.body.tribeLeaders.find((l) => l.item.id === lucas.id);

  console.log(`Nação Judá permanece com 60: ${judaRank2.points === 60}`);
  console.log(`Tribo Leão permanece com 50: ${leaoRank2.points === 50}`);
  console.log(`Líder Lucas Ferreira tem 50 pontos: ${lucasRank.points === 50}`);
  if (judaRank2.points !== 60 || leaoRank2.points !== 50 || lucasRank.points !== 50) {
    throw new Error('Falha no isolamento dos pontos de líder!');
  }

  // 8. Testar estorno auditado do Lançamento 1 (10 pts de Judá)
  console.log('5. Estornando lançamento 1 com justificativa...');
  const voidRes = await request('http://localhost:3000/api/scores/void', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      launchType: 'challenge',
      launchId: l1.body.scoreLaunch.id,
      reason: 'Lançamento estornado para teste de auditoria',
    },
  });
  console.log('Void status:', voidRes.status);

  const rankRes3 = await request('http://localhost:3000/api/rankings?period=week');
  const judaRank3 = rankRes3.body.nations.find((n) => n.item.id === juda.id);
  console.log(`Nação Judá após estorno de 10 pts esperada com 50: ${judaRank3.points}`);
  if (judaRank3.points !== 50) {
    throw new Error('Falha no recálculo após estorno auditado!');
  }

  // 9. Verificar consulta do histórico
  const historyRes = await request('http://localhost:3000/api/history');
  console.log(`Histórico total de lançamentos: ${historyRes.body.history.length}`);
  const voidedInHistory = historyRes.body.history.find((h) => h.id === l1.body.scoreLaunch.id);
  console.log(`Item estornado permanece no histórico como VOIDED: ${voidedInHistory.status === 'VOIDED'}`);
  console.log(`Motivo gravado na auditoria: "${voidedInHistory.voidReason}"`);

  console.log('\n--- TODOS OS CRITÉRIOS DE ACEITE FORAM VALIDADOS VIA HTTP COM SUCESSO! ---');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
