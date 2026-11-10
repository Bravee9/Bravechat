import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { apiRequire, loadModule } from './security-test-support.mjs';

const bcrypt = apiRequire('bcryptjs');
const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const digest = (value) => createHash('sha256').update(value).digest('hex');

async function fixture() {
  const user = { id: 'u', username: 'tester', email: 'tester@example.test', passwordHash: await bcrypt.hash('OldPassword1', 4), isBanned: false };
  const sessions = [];
  const tokenValue = 'a'.repeat(64);
  const reset = { id: 'reset', userId: user.id, usedAt: null, expiresAt: new Date(Date.now() + 60000), user: { isBanned: false } };
  let gate = async () => {};
  const prisma = {
    user: {
      findUnique: async () => ({ ...user }), findUniqueOrThrow: async () => ({ ...user }),
      update: async ({ data }) => { Object.assign(user, data); return { ...user }; },
      updateMany: async ({ where, data }) => {
        await gate();
        if (where.passwordHash !== user.passwordHash || user.isBanned) return { count: 0 };
        Object.assign(user, data); return { count: 1 };
      },
    },
    refreshToken: {
      create: async ({ data }) => { const row = { id: `s${sessions.length}`, isRevoked: false, ...data }; sessions.push(row); return row; },
      findUnique: async ({ where }) => {
        const row = sessions.find((item) => item.id === where.id || item.token === where.token);
        return row ? { ...row, user: { ...user } } : null;
      },
      findFirst: async ({ where }) => {
        const row = sessions.find((item) => item.id === where.id && !item.isRevoked);
        return row ? { id: row.id, user: { username: user.username, email: user.email } } : null;
      },
      updateMany: async ({ where }) => {
        let count = 0;
        for (const row of sessions) if ((!where.id || row.id === where.id) && !row.isRevoked) { row.isRevoked = true; count++; }
        return { count };
      },
    },
    passwordResetToken: {
      findUnique: async ({ where }) => where.tokenHash === digest(tokenValue) ? { ...reset } : null,
      updateMany: async () => { if (reset.usedAt) return { count: 0 }; reset.usedAt = new Date(); return { count: 1 }; },
    },
    $transaction: async (callback) => callback(prisma),
  };
  const env = { JWT_SECRET: 'security-test-secret-at-least-32-characters', JWT_EXPIRES_IN: '15m', FRONTEND_URL: 'http://localhost:3000', MAX_FILE_SIZE: 1024 };
  const app = apiRequire('fastify')();
  const r2 = apiRequire('fastify-plugin')(async (server) => { server.decorate('r2', { storage: {} }); });
  await loadModule('plugins/index.ts', { '../config/env': { env }, '../config/prisma': { prisma }, './r2': r2 }).registerPlugins(app);
  const dependencies = {
    '../config/prisma': { prisma }, '../config/env': { env },
    '../services/storage.service': { mediaUrl: () => null }, '../services/conversation': { fail },
    '../services/reset-mail': { developmentMailbox: () => true }, './websocket.routes': { revokeSessions() {} },
    '../services/voice-security': { revokeVoiceSessions: async () => {}, rotateVoiceSession: async () => {} },
  };
  await app.register(loadModule('routes/auth.routes.ts', dependencies).authRoutes, { prefix: '/auth' });
  const login = () => app.inject({ method: 'POST', url: '/auth/login', payload: { email: user.email, password: 'OldPassword1' } });
  const changePassword = () => app.inject({ method: 'POST', url: '/auth/reset-password', payload: { token: tokenValue, password: 'NewPassword1' } });
  const pauseIssuance = () => {
    let release, reached;
    const waiting = new Promise((resolve) => { reached = resolve; });
    const pending = new Promise((resolve) => { release = resolve; });
    gate = async () => { reached(); await pending; };
    return { waiting, release };
  };
  return { app, user, sessions, login, changePassword, pauseIssuance };
}

test('password reset prevents a delayed old-password login from issuing a session', async (t) => {
  const f = await fixture(); t.after(() => f.app.close());
  const pause = f.pauseIssuance(); t.after(pause.release);
  const login = f.login(); await pause.waiting;
  assert.equal((await f.changePassword()).statusCode, 200);
  pause.release();
  assert.equal((await login).statusCode, 401);
  assert.equal(f.sessions.length, 0);
});

test('password reset revokes sessions issued before it and rejects reuse of the reset token', async (t) => {
  const f = await fixture(); t.after(() => f.app.close());
  const login = await f.login(); assert.equal(login.statusCode, 200);
  const token = login.cookies.find((cookie) => cookie.name === 'token').value;
  assert.equal((await f.changePassword()).statusCode, 200);
  assert.equal((await f.app.inject({ url: '/auth/me', cookies: { token } })).statusCode, 401);
  assert.equal((await f.changePassword()).statusCode, 400);
});

test('a delayed refresh cannot recreate a session after password reset', async (t) => {
  const f = await fixture(); t.after(() => f.app.close());
  const login = await f.login();
  const refreshToken = login.cookies.find((cookie) => cookie.name === 'refreshToken').value;
  const pause = f.pauseIssuance(); t.after(pause.release);
  const refresh = f.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { refreshToken } });
  await pause.waiting;
  assert.equal((await f.changePassword()).statusCode, 200);
  pause.release();
  assert.equal((await refresh).statusCode, 401);
  assert.equal(f.sessions.filter((row) => !row.isRevoked).length, 0);
});

test('step-2 Gmail OTP login challenge verifies 6-digit OTP and marks email verified', async (t) => {
  const f = await fixture(); t.after(() => f.app.close());
  const step1 = await f.app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: f.user.email, password: 'OldPassword1', requireGmailOtp: true },
  });
  assert.equal(step1.statusCode, 200);
  const data = step1.json().data;
  assert.equal(data.requiresVerification, true);
  assert.equal(typeof data.challengeToken, 'string');
  assert.equal(typeof data.devOtp, 'string');

  const wrong = await f.app.inject({
    method: 'POST',
    url: '/auth/login/verify',
    payload: { challengeToken: data.challengeToken, code: '000000' },
  });
  assert.equal(wrong.statusCode, 401);

  const verified = await f.app.inject({
    method: 'POST',
    url: '/auth/login/verify',
    payload: { challengeToken: data.challengeToken, code: data.devOtp },
  });
  assert.equal(verified.statusCode, 200);
  assert.ok(verified.cookies.find((c) => c.name === 'token'));
});

test('QR code login lifecycle: init, scan, approve, and status poll issues session cookies', async (t) => {
  const f = await fixture(); t.after(() => f.app.close());
  const login = await f.login();
  const authCookie = login.cookies.find((c) => c.name === 'token').value;

  const initRes = await f.app.inject({ method: 'POST', url: '/auth/qr/init' });
  assert.equal(initRes.statusCode, 200);
  const qr = initRes.json().data;
  assert.ok(qr.qrId && qr.pollSecret && qr.shortCode.startsWith('BC-'));

  const scanRes = await f.app.inject({
    method: 'POST',
    url: '/auth/qr/scan',
    cookies: { token: authCookie },
    payload: { code: qr.shortCode },
  });
  assert.equal(scanRes.statusCode, 200);

  const scannedStatus = await f.app.inject({
    method: 'GET',
    url: `/auth/qr/status?qrId=${encodeURIComponent(qr.qrId)}&pollSecret=${encodeURIComponent(qr.pollSecret)}`,
  });
  assert.equal(scannedStatus.json().data.status, 'SCANNED');

  const approveRes = await f.app.inject({
    method: 'POST',
    url: '/auth/qr/approve',
    cookies: { token: authCookie },
    payload: { qrId: qr.qrId },
  });
  assert.equal(approveRes.statusCode, 200);

  const approvedStatus = await f.app.inject({
    method: 'GET',
    url: `/auth/qr/status?qrId=${encodeURIComponent(qr.qrId)}&pollSecret=${encodeURIComponent(qr.pollSecret)}`,
  });
  assert.equal(approvedStatus.json().data.status, 'APPROVED');
  assert.ok(approvedStatus.cookies.find((c) => c.name === 'token'));
});
