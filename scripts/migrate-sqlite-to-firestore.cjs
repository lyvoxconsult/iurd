/* One-time, repeatable import. Existing Firestore documents are never overwritten. */
const { PrismaClient } = require('@prisma/client');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createHash } = require('node:crypto');

if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'file:./dev.db';
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Defina FIREBASE_PROJECT_ID');
const credential = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
  ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') })
  : applicationDefault();
initializeApp({ projectId, credential });
const db = getFirestore();
const sqlite = new PrismaClient();
const mapping = [
  ['rally', 'rallies'], ['nation', 'nations'], ['tribe', 'tribes'],
  ['person', 'people'], ['challenge', 'challenges'],
  ['scoreLaunch', 'scoreLaunches'], ['leaderScoreLaunch', 'leaderScoreLaunches'],
];

async function importRow(model, collection, row) {
  const ref = db.collection(collection).doc(row.id);
  const markerRef = row.idempotencyKey
    ? db.collection('idempotencyKeys').doc(createHash('sha256').update(`${model}:${row.idempotencyKey}`).digest('hex'))
    : null;
  return db.runTransaction(async tx => {
    const [existing, marker] = await Promise.all([
      tx.get(ref),
      markerRef ? tx.get(markerRef) : Promise.resolve(null),
    ]);
    if (marker?.exists && marker.data().recordId !== row.id) {
      throw new Error(`Chave de idempotência em conflito: ${collection}/${row.id}`);
    }
    if (!existing.exists) tx.create(ref, row);
    if (markerRef && !marker?.exists) tx.create(markerRef, { recordId: row.id, rallyId: row.rallyId });
    return existing.exists ? 'existing' : 'created';
  });
}

(async () => {
  try {
    for (const [model, collection] of mapping) {
      const rows = await sqlite[model].findMany();
      let created = 0;
      for (const row of rows) if ((await importRow(model, collection, row)) === 'created') created++;
      console.log(`${collection}: origem=${rows.length}, criados=${created}, existentes=${rows.length - created}`);
    }
  } finally {
    await sqlite.$disconnect();
  }
})().catch(error => { console.error('Migração interrompida:', error.message); process.exitCode = 1; });
