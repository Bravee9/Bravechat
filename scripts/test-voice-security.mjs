import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequire, loadModule } from './security-test-support.mjs';

function fixture() {
  const channel = { id: 'c', type: 'VOICE', voiceEpoch: 0 };
  const sessions = new Map([['s', { userId: 'u', isRevoked: false }], ['next', { userId: 'u', isRevoked: false }]]);
  const leases = []; const removed = []; const deleted = []; const updated = [];
  let failDeletion = false; let afterGrant = () => {};
  const participant = { identity: 'u:tab', metadata: JSON.stringify({ sid: 's', channelId: 'c' }) };
  const rooms = new Map([['channel:c:0', []]]);
  class RoomServiceClient {
    async removeParticipant(room, identity) { removed.push({ room, identity }); }
    async deleteRoom(room) { if (failDeletion) throw new Error('SFU failed: access_token=PRIVATE-ADMIN-JWT'); deleted.push(room); rooms.delete(room); }
    async updateParticipant(room, identity, options) { updated.push({ room, identity, options }); if (options.permission) afterGrant(); }
    async listRooms() { return [...rooms.keys()].map((name) => ({ name })); }
    async listParticipants(room) { return rooms.get(room) || []; }
  }
  const prisma = {
    channel: {
      findFirst: async () => ({ ...channel }), findUnique: async () => ({ ...channel }),
      findMany: async () => [{ ...channel }],
      update: async ({ data }) => { channel.voiceEpoch += data.voiceEpoch.increment; return { ...channel }; },
    },
    refreshToken: { findFirst: async ({ where }) => {
      const row = sessions.get(where.id);
      return row && row.userId === where.userId && !row.isRevoked ? { id: where.id } : null;
    } },
    voiceSession: {
      upsert: async ({ create }) => { if (!leases.some((row) => row.channelId === create.channelId && row.sessionId === create.sessionId && row.epoch === create.epoch)) leases.push({ ...create }); },
      findUnique: async ({ where }) => {
        const key = where.channelId_sessionId_epoch;
        return leases.find((row) => row.channelId === key.channelId && row.sessionId === key.sessionId && row.epoch === key.epoch) || null;
      },
      findMany: async ({ where }) => leases.filter((row) => (!where.sessionId || row.sessionId === where.sessionId) && sessions.get(row.sessionId)?.userId === where.session.userId).map((row) => ({ ...row, channel: { voiceEpoch: channel.voiceEpoch } })),
    },
    $transaction: async (callback) => callback(prisma),
  };
  const env = { LIVEKIT_URL: 'ws://test', LIVEKIT_API_KEY: 'key', LIVEKIT_API_SECRET: 'secret' };
  const service = loadModule('services/voice-security.ts', {
    '../config/env': { env }, '../config/prisma': { prisma },
    './conversation': { fail: (statusCode, message) => Object.assign(new Error(message), { statusCode }) },
    'livekit-server-sdk': { ...apiRequire('livekit-server-sdk'), RoomServiceClient },
  });
  return { service, channel, sessions, leases, participant, rooms, removed, deleted, updated, setFailDeletion: (value) => { failDeletion = value; }, onGrant: (callback) => { afterGrant = callback; } };
}

test('revoked sessions and old room generations never receive admission privileges', async () => {
  const f = fixture();
  assert.equal(await f.service.registerVoiceToken('c', 's', 'u'), 'channel:c:0');
  assert.equal(await f.service.admitVoiceParticipant('channel:c:0', f.participant), true);
  f.sessions.get('s').isRevoked = true;
  assert.equal(await f.service.admitVoiceParticipant('channel:c:0', f.participant), false);
  assert.equal(f.updated.length, 1);
  assert.equal(f.removed.length, 1);
});

test('revocation closes the old room even when the token holder has disconnected', async () => {
  const f = fixture();
  await f.service.registerVoiceToken('c', 's', 'u');
  await f.service.revokeVoiceSessions('u', 's');
  assert.deepEqual(f.deleted, ['channel:c:0']);
  assert.equal(f.channel.voiceEpoch, 1);
  assert.equal(await f.service.admitVoiceParticipant('channel:c:0', f.participant), false);
  assert.equal(await f.service.registerVoiceToken('c', 'next', 'u'), 'channel:c:1');
});

test('a reset during the permission update removes the participant again', async () => {
  const f = fixture(); await f.service.registerVoiceToken('c', 's', 'u');
  f.onGrant(() => { f.sessions.get('s').isRevoked = true; });
  assert.equal(await f.service.admitVoiceParticipant('channel:c:0', f.participant), false);
  assert.equal(f.removed.length, 1);
});

test('reconciliation retries obsolete room cleanup after a LiveKit outage', async () => {
  const f = fixture(); await f.service.registerVoiceToken('c', 's', 'u');
  f.setFailDeletion(true);
  await assert.rejects(() => f.service.revokeVoiceSessions('u', 's'), (error) => {
    assert.equal(error.statusCode, 503);
    assert.equal(String(error.stack).includes('PRIVATE-ADMIN-JWT'), false);
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(f.channel.voiceEpoch, 1);
  f.setFailDeletion(false);
  await f.service.reconcileVoiceRooms();
  assert.deepEqual(f.deleted, ['channel:c:0']);
});

test('refresh transfers issued-room leases and participant metadata to the new session', async () => {
  const f = fixture(); await f.service.registerVoiceToken('c', 's', 'u');
  f.rooms.set('channel:c:0', [f.participant]);
  await f.service.rotateVoiceSession('u', 's', 'next');
  assert.equal(f.leases.some((row) => row.sessionId === 'next'), true);
  assert.equal(JSON.parse(f.updated[0].options.metadata).sid, 'next');
  await f.service.revokeVoiceSessions('u', 'next');
  assert.deepEqual(f.deleted, ['channel:c:0']);
});

test('new LiveKit tokens have no media privileges before signed webhook admission', async (t) => {
  const sdk = apiRequire('livekit-server-sdk');
  const env = { LIVEKIT_URL: 'ws://test', LIVEKIT_API_KEY: 'key', LIVEKIT_API_SECRET: 'secret', LIVEKIT_TOKEN_TTL_SECONDS: 300 };
  const { voiceRoutes } = loadModule('routes/voice.routes.ts', {
    '../config/env': { env }, '../config/prisma': { prisma: { channel: { findFirst: async () => ({ id: 'c', type: 'VOICE', userLimit: null, server: { members: [] } }) } } },
    '../services/voice-security': { startVoiceSecurity() {}, registerVoiceToken: async () => 'channel:c:2', admitVoiceParticipant: async () => false },
  });
  const app = apiRequire('fastify')(); t.after(() => app.close());
  app.decorate('authenticate', async (request) => { request.user = { id: 'u', sid: 's', username: 'u' }; });
  await app.register(voiceRoutes);
  const response = await app.inject({ method: 'POST', url: '/channels/c/token' });
  assert.equal(response.statusCode, 200);
  const claims = await new sdk.TokenVerifier(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET).verify(response.json().data.token);
  assert.equal(claims.video.room, 'channel:c:2');
  assert.equal(claims.video.canPublish, false);
  assert.equal(claims.video.canSubscribe, false);
  assert.equal(claims.video.canPublishData, false);
  assert.equal(claims.video.canUpdateOwnMetadata, false);
  assert.equal(JSON.parse(claims.metadata).sid, 's');
});
