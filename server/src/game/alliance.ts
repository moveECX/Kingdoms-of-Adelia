/**
 * Allianzen (GAME-MECHANICS §8): bis 100 Mitglieder, Ränge (leader/officer/member),
 * Diplomatie (allied/nap/enemy) und ein Event-Log. Allianz-Chat läuft über WS.
 */
import type { Kysely } from 'kysely';
import type { Database } from '../db/types';

export class AllianceError extends Error {}

const MAX_MEMBERS = 100;
export type Rank = 'leader' | 'officer' | 'member';
export type DiploStatus = 'allied' | 'nap' | 'enemy';

async function logEvent(db: Kysely<Database>, allianceId: number, text: string): Promise<void> {
  await db.insertInto('alliance_events').values({ alliance_id: allianceId, text }).execute();
}

export async function createAlliance(
  db: Kysely<Database>,
  accountId: number,
  name: string,
  tag: string,
): Promise<{ allianceId: number }> {
  const acc = await db.selectFrom('accounts').select('alliance_id').where('id', '=', accountId).executeTakeFirstOrThrow();
  if (acc.alliance_id !== null) throw new AllianceError('Du bist bereits in einer Allianz');
  const cleanName = name.trim();
  const cleanTag = tag.trim();
  if (cleanName.length < 3 || cleanTag.length < 2) throw new AllianceError('Name (≥3) oder Tag (≥2) zu kurz');

  const existing = await db
    .selectFrom('alliances')
    .select('id')
    .where((eb) => eb.or([eb('name', '=', cleanName), eb('tag', '=', cleanTag)]))
    .executeTakeFirst();
  if (existing !== undefined) throw new AllianceError('Name oder Tag bereits vergeben');

  const row = await db
    .insertInto('alliances')
    .values({ name: cleanName, tag: cleanTag, leader_account: accountId })
    .returning('id')
    .executeTakeFirstOrThrow();
  await db
    .updateTable('accounts')
    .set({ alliance_id: row.id, alliance_rank: 'leader' })
    .where('id', '=', accountId)
    .execute();
  await logEvent(db, row.id, `Allianz „${cleanName}" gegründet`);
  return { allianceId: row.id };
}

export async function joinAlliance(db: Kysely<Database>, accountId: number, allianceId: number): Promise<void> {
  const acc = await db.selectFrom('accounts').select('alliance_id').where('id', '=', accountId).executeTakeFirstOrThrow();
  if (acc.alliance_id !== null) throw new AllianceError('Du bist bereits in einer Allianz');
  const alliance = await db.selectFrom('alliances').select('id').where('id', '=', allianceId).executeTakeFirst();
  if (alliance === undefined) throw new AllianceError('Allianz nicht gefunden');

  const members = await db.selectFrom('accounts').select('id').where('alliance_id', '=', allianceId).execute();
  if (members.length >= MAX_MEMBERS) throw new AllianceError('Die Allianz ist voll (100 Mitglieder)');

  await db
    .updateTable('accounts')
    .set({ alliance_id: allianceId, alliance_rank: 'member' })
    .where('id', '=', accountId)
    .execute();
  await logEvent(db, allianceId, `Account ${accountId} ist beigetreten`);
}

export async function leaveAlliance(db: Kysely<Database>, accountId: number): Promise<void> {
  const acc = await db
    .selectFrom('accounts')
    .select(['alliance_id', 'alliance_rank'])
    .where('id', '=', accountId)
    .executeTakeFirstOrThrow();
  if (acc.alliance_id === null) throw new AllianceError('Du bist in keiner Allianz');

  if (acc.alliance_rank === 'leader') {
    const other = await db
      .selectFrom('accounts')
      .select('id')
      .where('alliance_id', '=', acc.alliance_id)
      .where('id', '!=', accountId)
      .executeTakeFirst();
    if (other !== undefined) {
      throw new AllianceError('Übertrage zuerst die Führung (ein Leader kann eine besetzte Allianz nicht verlassen)');
    }
    // Allein → Allianz auflösen.
    await db.updateTable('accounts').set({ alliance_id: null, alliance_rank: null }).where('id', '=', accountId).execute();
    await db.deleteFrom('alliances').where('id', '=', acc.alliance_id).execute();
    return;
  }
  await logEvent(db, acc.alliance_id, `Account ${accountId} hat die Allianz verlassen`);
  await db.updateTable('accounts').set({ alliance_id: null, alliance_rank: null }).where('id', '=', accountId).execute();
}

/** Leader vergibt Ränge; 'leader' überträgt die Führung (alter Leader → officer). */
export async function setRank(
  db: Kysely<Database>,
  actorId: number,
  targetId: number,
  rank: Rank,
): Promise<void> {
  const actor = await db
    .selectFrom('accounts')
    .select(['alliance_id', 'alliance_rank'])
    .where('id', '=', actorId)
    .executeTakeFirstOrThrow();
  if (actor.alliance_rank !== 'leader') throw new AllianceError('Nur der Leader darf Ränge vergeben');
  const target = await db.selectFrom('accounts').select('alliance_id').where('id', '=', targetId).executeTakeFirst();
  if (target === undefined || target.alliance_id !== actor.alliance_id || actor.alliance_id === null) {
    throw new AllianceError('Spieler ist nicht in deiner Allianz');
  }
  if (rank === 'leader') {
    await db.updateTable('accounts').set({ alliance_rank: 'officer' }).where('id', '=', actorId).execute();
    await db.updateTable('accounts').set({ alliance_rank: 'leader' }).where('id', '=', targetId).execute();
    await db.updateTable('alliances').set({ leader_account: targetId }).where('id', '=', actor.alliance_id).execute();
  } else {
    await db.updateTable('accounts').set({ alliance_rank: rank }).where('id', '=', targetId).execute();
  }
  await logEvent(db, actor.alliance_id, `Account ${targetId} ist jetzt ${rank}`);
}

/** Leader/Officer setzen den Diplomatie-Status zu einer anderen Allianz. */
export async function setDiplomacy(
  db: Kysely<Database>,
  actorId: number,
  otherAllianceId: number,
  status: DiploStatus,
): Promise<void> {
  const actor = await db
    .selectFrom('accounts')
    .select(['alliance_id', 'alliance_rank'])
    .where('id', '=', actorId)
    .executeTakeFirstOrThrow();
  if (actor.alliance_id === null) throw new AllianceError('Du bist in keiner Allianz');
  if (actor.alliance_rank !== 'leader' && actor.alliance_rank !== 'officer') {
    throw new AllianceError('Nur Leader oder Officer dürfen Diplomatie setzen');
  }
  if (otherAllianceId === actor.alliance_id) throw new AllianceError('Keine Diplomatie mit der eigenen Allianz');
  const other = await db.selectFrom('alliances').select('id').where('id', '=', otherAllianceId).executeTakeFirst();
  if (other === undefined) throw new AllianceError('Andere Allianz nicht gefunden');

  const [a, b] =
    actor.alliance_id < otherAllianceId ? [actor.alliance_id, otherAllianceId] : [otherAllianceId, actor.alliance_id];
  await db
    .insertInto('alliance_diplomacy')
    .values({ alliance_a: a, alliance_b: b, status })
    .onConflict((oc) => oc.columns(['alliance_a', 'alliance_b']).doUpdateSet({ status }))
    .execute();
  await logEvent(db, actor.alliance_id, `Diplomatie mit Allianz ${otherAllianceId}: ${status}`);
}
