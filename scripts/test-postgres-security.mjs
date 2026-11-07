import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { apiRequire, loadModule } from './security-test-support.mjs';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL to an isolated local bravechat_security_* database after applying migrations.');
const parsed = new URL(url);
if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.startsWith('/bravechat_security_')) throw new Error('Security DB tests require an isolated local bravechat_security_* database.');
const { PrismaClient } = apiRequire('@prisma/client');
const bcrypt = apiRequire('bcryptjs');
const prisma = new PrismaClient({ datasources: { db: { url } }, transactionOptions: { timeout: 15000 } });
const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('PostgreSQL security integration', { timeout: 60000 }, async (t) => {
  t.after(() => prisma.$disconnect());

  async function fixture(t, intercept) {
    const tag = randomUUID().replaceAll('-', '').slice(0, 12);
    const user = await prisma.user.create({ data: { email: `${tag}@example.test`, username: `sec_${tag}`, passwordHash: await bcrypt.hash('OldPassword1', 4) } });
    const resetValue = createHash('sha256').update(tag).digest('hex');
    const resetUpdating = deferred();
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(resetValue).digest('hex'), expiresAt: new Date(Date.now() + 60000) } });
    const db = prisma.$extends({ query: { user: {
      updateMany: async ({ args, query }) => intercept(args, () => query(args)),
      update: async ({ args, query }) => { if (args.data.passwordHash) resetUpdating.resolve(); return query(args); },
    } } });
    const env = { JWT_SECRET: 'postgres-security-test-secret-over-32-characters', JWT_EXPIRES_IN: '15m', FRONTEND_URL: 'http://localhost:3000', MAX_FILE_SIZE: 1024 };
    const app = apiRequire('fastify')();
    t.after(async () => { await app.close(); await prisma.server.deleteMany({ where: { ownerId: user.id } }); await prisma.user.delete({ where: { id: user.id } }); });
    await loadModule('plugins/index.ts', {
      '../config/env': { env }, '../config/prisma': { prisma: db },
      './r2': apiRequire('fastify-plugin')(async (server) => { server.decorate('r2', { storage: {} }); }),
    }).registerPlugins(app);
    await app.register(loadModule('routes/auth.routes.ts', {
      '../config/env': { env }, '../config/prisma': { prisma: db },
      '../services/storage.service': { mediaUrl: () => null }, '../services/conversation': { fail },
      '../services/reset-mail': { developmentMailbox: () => true }, './websocket.routes': { revokeSessions() {} },
      '../services/voice-security': { revokeVoiceSessions: async () => {}, rotateVoiceSession: async () => {} },
    }).authRoutes, { prefix: '/auth' });
    return {
      user, app, resetUpdating,
      login: () => app.inject({ method: 'POST', url: '/auth/login', payload: { email: user.email, password: 'OldPassword1' } }),
      reset: () => app.inject({ method: 'POST', url: '/auth/reset-password', payload: { token: resetValue, password: 'NewPassword1' } }),
    };
  }

  await t.test('reset commits before delayed login UPDATE: stale password is rejected', async (t) => {
    const reached = deferred(), release = deferred();
    const f = await fixture(t, async (_args, query) => { reached.resolve(); await release.promise; return query(); });
    t.after(release.resolve);
    const login = f.login(); await reached.promise;
    assert.equal((await f.reset()).statusCode, 200);
    release.resolve();
    assert.equal((await login).statusCode, 401);
    assert.equal(await prisma.refreshToken.count({ where: { userId: f.user.id, isRevoked: false } }), 0);
  });

  await t.test('login holds the user lock: reset waits, then revokes the newly issued session', async (t) => {
    const reached = deferred(), release = deferred();
    const f = await fixture(t, async (_args, query) => { const result = await query(); reached.resolve(); await release.promise; return result; });
    t.after(release.resolve);
    const login = f.login(); await reached.promise;
    const reset = f.reset();
    await f.resetUpdating.promise;
    let blocked = false;
    const deadline = Date.now() + 2000;
    while (!blocked && Date.now() < deadline) {
      const [state] = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%UPDATE%users%'`;
      blocked = state.count > 0;
      if (!blocked) await delay(20);
    }
    assert.equal(blocked, true, 'PostgreSQL must report reset waiting for the login user-row lock');
    release.resolve();
    const response = await login; assert.equal(response.statusCode, 200);
    assert.equal((await reset).statusCode, 200);
    const token = response.cookies.find((cookie) => cookie.name === 'token').value;
    assert.equal((await f.app.inject({ url: '/auth/me', cookies: { token } })).statusCode, 401);
  });

  await t.test('reset prevents a refresh that read the prior credentials from issuing a new session', async (t) => {
    let intercept = async (_args, query) => query();
    const f = await fixture(t, (...args) => intercept(...args));
    const login = await f.login();
    const refreshToken = login.cookies.find((cookie) => cookie.name === 'refreshToken').value;
    const reached = deferred(), release = deferred(); t.after(release.resolve);
    intercept = async (_args, query) => { reached.resolve(); await release.promise; return query(); };
    const refresh = f.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { refreshToken } });
    await reached.promise;
    assert.equal((await f.reset()).statusCode, 200);
    release.resolve();
    assert.equal((await refresh).statusCode, 401);
    assert.equal(await prisma.refreshToken.count({ where: { userId: f.user.id, isRevoked: false } }), 0);
  });

  await t.test('issued room leases and generation revocation persist in PostgreSQL', async (t) => {
    const f = await fixture(t, async (_args, query) => query());
    const server = await prisma.server.create({ data: { name: 'Security test', ownerId: f.user.id } });
    await prisma.serverMember.create({ data: { serverId: server.id, userId: f.user.id } });
    const channel = await prisma.channel.create({ data: { serverId: server.id, name: 'voice', type: 'VOICE' } });
    const session = await prisma.refreshToken.create({ data: { userId: f.user.id, token: randomUUID(), expiresAt: new Date(Date.now() + 60000) } });
    const deleted = [];
    class RoomServiceClient { async deleteRoom(name) { deleted.push(name); } }
    const livekit = apiRequire('livekit-server-sdk');
    const livekitUrl = process.env.TEST_LIVEKIT_URL;
    if (livekitUrl && !['localhost', '127.0.0.1'].includes(new URL(livekitUrl).hostname)) throw new Error('Use an isolated local TEST_LIVEKIT_URL.');
    const livekitEnv = { LIVEKIT_URL: livekitUrl || 'ws://test', LIVEKIT_API_KEY: 'devkey', LIVEKIT_API_SECRET: 'devsecret' };
    const control = livekitUrl ? new livekit.RoomServiceClient(livekitUrl, 'devkey', 'devsecret') : null;
    if (control) await control.createRoom({ name: `channel:${channel.id}:0` });
    const service = loadModule('services/voice-security.ts', {
      '../config/prisma': { prisma }, '../config/env': { env: livekitEnv },
      './conversation': { fail }, 'livekit-server-sdk': control ? livekit : { ...livekit, RoomServiceClient },
    });
    assert.equal(await service.registerVoiceToken(channel.id, session.id, f.user.id), `channel:${channel.id}:0`);
    assert.equal(await prisma.voiceSession.count({ where: { channelId: channel.id } }), 1);
    await service.revokeVoiceSessions(f.user.id, session.id);
    assert.equal((await prisma.channel.findUniqueOrThrow({ where: { id: channel.id } })).voiceEpoch, 1);
    if (control) assert.equal((await control.listRooms([`channel:${channel.id}:0`])).length, 0);
    else assert.deepEqual(deleted, [`channel:${channel.id}:0`]);
  });
});
