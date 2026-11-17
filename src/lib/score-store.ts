import { createHash } from 'node:crypto';
import { firestore, fromFirestore } from './firestore-admin';

type LaunchData = Record<string, any>;

/** Creates a named challenge and its first launch in one Firestore transaction. */
export async function createNamedChallengeLaunch(rallyId: string, title: string, points: number, launch: LaunchData) {
  const db = firestore();
  const challengeCol = db.collection('challenges');
  const scoreCol = db.collection('scoreLaunches');
  const marker = launch.idempotencyKey
    ? db.collection('idempotencyKeys').doc(createHash('sha256').update(`scoreLaunch:${launch.idempotencyKey}`).digest('hex'))
    : null;
  return db.runTransaction(async tx => {
    const [challenges, existingKey] = await Promise.all([
      tx.get(challengeCol.where('rallyId', '==', rallyId)),
      marker ? tx.get(marker) : Promise.resolve(null),
    ]);
    if (existingKey?.exists) {
      const existing = await tx.get(scoreCol.doc(existingKey.data()!.recordId));
      if (!existing.exists || existing.data()!.rallyId !== rallyId) throw new Error('Chave de lançamento pertence a outro rali');
      return { id: existing.id, ...fromFirestore(existing.data()), duplicateIgnored: true };
    }
    const found = challenges.docs.find(doc => doc.data().active === true && doc.data().title === title);
    if (found && found.data().defaultPoints !== points) throw new Error(`Este desafio vale ${found.data().defaultPoints} pontos`);
    const now = new Date();
    const challengeRef = found?.ref || challengeCol.doc();
    const scoreRef = scoreCol.doc();
    if (!found) tx.create(challengeRef, { rallyId, title, description: null, defaultPoints: points, active: true, createdAt: now, updatedAt: now });
    const row = { ...launch, challengeId: challengeRef.id, createdAt: now, updatedAt: now };
    tx.create(scoreRef, row);
    if (marker) tx.create(marker, { recordId: scoreRef.id, rallyId });
    return { id: scoreRef.id, ...row, duplicateIgnored: false };
  });
}
