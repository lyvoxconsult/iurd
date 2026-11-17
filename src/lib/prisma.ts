/* Firestore persistence behind the existing repository interface. Prisma types keep
   route contracts intact while the SQLite schema remains available for import. */
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { firestore, fromFirestore } from './firestore-admin';

type Model = 'rally' | 'nation' | 'tribe' | 'person' | 'challenge' | 'scoreLaunch' | 'leaderScoreLaunch';
type RecordData = Record<string, any>;
const models: Model[] = ['rally', 'nation', 'tribe', 'person', 'challenge', 'scoreLaunch', 'leaderScoreLaunch'];
const collectionName: Record<Model, string> = {
  rally: 'rallies', nation: 'nations', tribe: 'tribes', person: 'people',
  challenge: 'challenges', scoreLaunch: 'scoreLaunches', leaderScoreLaunch: 'leaderScoreLaunches',
};
const relation: Record<string, { model: Model; key: string }> = {
  nation: { model: 'nation', key: 'nationId' }, tribe: { model: 'tribe', key: 'tribeId' },
  leader: { model: 'person', key: 'leaderId' }, challenge: { model: 'challenge', key: 'challengeId' },
  targetPerson: { model: 'person', key: 'targetPersonId' },
};
const children: Record<string, { model: Model; key: string }> = {
  nations: { model: 'nation', key: 'rallyId' }, tribes: { model: 'tribe', key: 'rallyId' },
  people: { model: 'person', key: 'rallyId' }, challenges: { model: 'challenge', key: 'rallyId' },
  scoreLaunches: { model: 'scoreLaunch', key: 'rallyId' }, leaderScores: { model: 'leaderScoreLaunch', key: 'rallyId' },
};
function col(model: Model) { return firestore().collection(collectionName[model]); }
function match(row: RecordData, where?: RecordData): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key];
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      if ('equals' in expected) return actual === expected.equals;
      if ('contains' in expected) return typeof actual === 'string' && actual.toLocaleLowerCase('pt-BR').includes(String(expected.contains).toLocaleLowerCase('pt-BR'));
      return false;
    }
    return actual === expected;
  });
}
function select(row: RecordData, spec?: RecordData): RecordData {
  if (!spec) return row;
  return Object.fromEntries(Object.entries(spec).filter(([, yes]) => yes === true).map(([key]) => [key, row[key]]));
}
function sortRows(rows: RecordData[], orderBy?: RecordData) {
  if (!orderBy) return rows;
  const [key, direction] = Object.entries(orderBy)[0];
  return rows.sort((a, b) => {
    const av = a[key] instanceof Date ? a[key].getTime() : a[key];
    const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
    return (av < bv ? -1 : av > bv ? 1 : 0) * (direction === 'desc' ? -1 : 1);
  });
}
function keyRef(model: Model, key: string) {
  return firestore().collection('idempotencyKeys').doc(createHash('sha256').update(`${model}:${key}`).digest('hex'));
}
async function rawMany(model: Model, where?: RecordData): Promise<RecordData[]> {
  let query: FirebaseFirestore.Query = col(model);
  if (where?.rallyId && typeof where.rallyId === 'string') query = query.where('rallyId', '==', where.rallyId);
  const snap = await query.get();
  return snap.docs.map(doc => ({ id: doc.id, ...fromFirestore(doc.data()) })).filter(row => match(row, where));
}
async function rawUnique(model: Model, where: RecordData): Promise<RecordData | null> {
  if (where.id) {
    const snap = await col(model).doc(where.id).get();
    return snap.exists ? { id: snap.id, ...fromFirestore(snap.data()) } : null;
  }
  if (where.idempotencyKey) {
    const marker = await keyRef(model, where.idempotencyKey).get();
    return marker.exists ? rawUnique(model, { id: marker.data()!.recordId }) : null;
  }
  return (await rawMany(model, where))[0] || null;
}
async function enrich(model: Model, row: RecordData, options?: RecordData): Promise<RecordData> {
  if (!options?.include && !options?.select) return row;
  const additions: RecordData = {};
  const nested = { ...options.include, ...options.select };
  for (const [name, spec] of Object.entries(nested)) {
    if (name === '_count') {
      const counts: RecordData = {};
      for (const key of Object.keys((spec as RecordData).select || {})) {
        let link = children[key];
        if (model === 'nation' && key === 'tribes') link = { model: 'tribe', key: 'nationId' };
        if (model === 'nation' && key === 'people') link = { model: 'person', key: 'nationId' };
        if (model === 'tribe' && key === 'people') link = { model: 'person', key: 'tribeId' };
        if (model === 'challenge' && key === 'scoreLaunches') link = { model: 'scoreLaunch', key: 'challengeId' };
        if (!link) continue;
        counts[key] = (await rawMany(link.model, { [link.key]: row.id })).length;
      }
      additions._count = counts;
    } else if (relation[name]) {
      const link = relation[name];
      const related = row[link.key] ? await rawUnique(link.model, { id: row[link.key] }) : null;
      additions[name] = related ? await enrich(link.model, related, spec === true ? undefined : spec as RecordData) : null;
    } else if (children[name]) {
      const link = model === 'nation' && name === 'tribes' ? { model: 'tribe' as Model, key: 'nationId' } : children[name];
      additions[name] = await findMany(link.model, { ...(spec === true ? {} : spec as RecordData), where: { [link.key]: row.id } });
    }
  }
  return { ...select(row, options.select), ...additions };
}
async function findMany(model: Model, args: RecordData = {}) {
  let rows = sortRows(await rawMany(model, args.where), args.orderBy);
  if (args.distinct?.length) {
    const seen = new Set<string>();
    rows = rows.filter(row => { const key = JSON.stringify(args.distinct.map((field: string) => row[field])); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  return Promise.all(rows.map(row => enrich(model, row, args)));
}
async function create(model: Model, args: RecordData) {
  const { data, ...options } = args;
  const ref = col(model).doc();
  const now = new Date();
  const row = { ...data, createdAt: now, updatedAt: now };
  if (data.idempotencyKey && (model === 'scoreLaunch' || model === 'leaderScoreLaunch')) {
    const marker = keyRef(model, data.idempotencyKey);
    const result = await firestore().runTransaction(async tx => {
      const existing = await tx.get(marker);
      if (existing.exists) return existing.data()!.recordId as string;
      tx.create(ref, row);
      tx.create(marker, { recordId: ref.id, rallyId: row.rallyId });
      return ref.id;
    });
    const stored = result === ref.id ? { id: ref.id, ...row } : await rawUnique(model, { id: result });
    if (stored?.rallyId !== row.rallyId) throw new Error('Chave de lançamento pertence a outro rali');
    return { ...await enrich(model, stored!, options), duplicateIgnored: result !== ref.id };
  }
  await ref.create(row);
  return enrich(model, { id: ref.id, ...row }, options);
}
async function update(model: Model, args: RecordData) {
  const ref = col(model).doc(args.where.id);
  await ref.update({ ...args.data, updatedAt: new Date() });
  const row = await rawUnique(model, { id: ref.id });
  return enrich(model, row!, args);
}
async function updateMany(model: Model, args: RecordData) {
  const rows = await rawMany(model, args.where);
  const batch = firestore().batch();
  rows.forEach(row => batch.update(col(model).doc(row.id), { ...args.data, updatedAt: new Date() }));
  if (rows.length) await batch.commit();
  return { count: rows.length };
}
function repository(model: Model) {
  return {
    findMany: (args?: RecordData) => findMany(model, args),
    findFirst: async (args?: RecordData) => (await findMany(model, args))[0] || null,
    findUnique: async (args: RecordData) => { const row = await rawUnique(model, args.where); return row ? enrich(model, row, args) : null; },
    count: async (args?: RecordData) => (await rawMany(model, args?.where)).length,
    create: (args: RecordData) => create(model, args),
    createMany: async (args: RecordData) => { const rows = args.data as RecordData[]; for (const row of rows) await create(model, { data: row }); return { count: rows.length }; },
    update: (args: RecordData) => update(model, args),
    updateMany: (args: RecordData) => updateMany(model, args),
    delete: async (args: RecordData) => { const row = await rawUnique(model, args.where); if (!row) throw new Error('Registro não encontrado'); await col(model).doc(row.id).delete(); return row; },
  };
}
const store = Object.fromEntries(models.map(model => [model, repository(model)])) as RecordData;
export const prisma = store as unknown as PrismaClient;
export default prisma;
