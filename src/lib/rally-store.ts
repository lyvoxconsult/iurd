import { firestore } from './firestore-admin';

const firstTribes = ['Tribo Leão', 'Tribo Guerreiros', 'Tribo Vencedores', 'Tribo Conquistadores', 'Tribo Aliança', 'Tribo Firmeza'];
const secondTribes = ['Tribo Águia', 'Tribo Valentes', 'Tribo Sentinela', 'Tribo Chama', 'Tribo Rocha', 'Tribo Redenção'];

export async function activateRally(id: string) {
  const db = firestore();
  return db.runTransaction(async tx => {
    const target = db.collection('rallies').doc(id);
    const pointer = db.collection('meta').doc('activeRally');
    const [found, active] = await Promise.all([tx.get(target), tx.get(db.collection('rallies').where('isActive', '==', true)), tx.get(pointer)]);
    if (!found.exists) throw new Error('Rali não encontrado');
    const now = new Date();
    active.docs.filter(doc => doc.id !== id).forEach(doc => tx.update(doc.ref, { isActive: false, updatedAt: now }));
    tx.update(target, { isActive: true, endDate: null, updatedAt: now });
    tx.set(pointer, { rallyId: id, updatedAt: now });
  });
}

export async function closeRally(id: string) {
  const db = firestore();
  return db.runTransaction(async tx => {
    const target = db.collection('rallies').doc(id);
    const pointer = db.collection('meta').doc('activeRally');
    const [found, activePointer] = await Promise.all([tx.get(target), tx.get(pointer)]);
    if (!found.exists || found.data()!.isActive !== true) throw new Error('Rali ativo não encontrado');
    if (activePointer.exists && activePointer.data()!.rallyId !== id) throw new Error('Rali ativo mudou; atualize a tela');
    const now = new Date();
    tx.update(target, { isActive: false, endDate: now, updatedAt: now });
    tx.set(pointer, { rallyId: null, updatedAt: now });
  });
}

export async function createRally(name: string, startDate: Date) {
  const db = firestore();
  return db.runTransaction(async tx => {
    const pointer = db.collection('meta').doc('activeRally');
    const [active] = await Promise.all([
      tx.get(db.collection('rallies').where('isActive', '==', true)),
      tx.get(pointer),
    ]);
    const now = new Date();
    const rally = db.collection('rallies').doc();
    const rallyData = { name, startDate, endDate: null, isActive: true, createdAt: now, updatedAt: now };
    active.docs.forEach(doc => tx.update(doc.ref, { isActive: false, updatedAt: now }));
    tx.create(rally, rallyData);
    tx.set(pointer, { rallyId: rally.id, updatedAt: now });
    for (const [index, [nationName, color, tribes]] of [
      ['Nação Judá', '#f59e0b', firstTribes], ['Nação Benjamim', '#0ea5e9', secondTribes],
    ].entries()) {
      const nation = db.collection('nations').doc();
      tx.create(nation, { rallyId: rally.id, name: nationName, color, orderIndex: index + 1, createdAt: now, updatedAt: now });
      (tribes as string[]).forEach((tribeName, tribeIndex) => {
        tx.create(db.collection('tribes').doc(), { rallyId: rally.id, nationId: nation.id, name: tribeName, code: null, orderIndex: tribeIndex + 1, createdAt: now, updatedAt: now });
      });
    }
    return { id: rally.id, ...rallyData };
  });
}

export async function createTribe(nationId: string, name: string, code?: string) {
  const db = firestore();
  return db.runTransaction(async tx => {
    const nationRef = db.collection('nations').doc(nationId);
    const [nation, tribes] = await Promise.all([tx.get(nationRef), tx.get(db.collection('tribes').where('nationId', '==', nationId))]);
    if (!nation.exists) throw new Error('Nação não encontrada');
    if (tribes.size >= 6) return null;
    const orderIndex = Math.max(0, ...tribes.docs.map(doc => Number(doc.data().orderIndex) || 0)) + 1;
    const now = new Date();
    const ref = db.collection('tribes').doc();
    const data = { rallyId: nation.data()!.rallyId, nationId, name, code: code || null, orderIndex, createdAt: now, updatedAt: now };
    tx.create(ref, data);
    tx.update(nationRef, { tribeRevision: (Number(nation.data()!.tribeRevision) || 0) + 1, updatedAt: now });
    return { id: ref.id, ...data, nation: { id: nation.id, name: nation.data()!.name, color: nation.data()!.color } };
  });
}
