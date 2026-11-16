import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import vm from 'node:vm';
import { loadModule } from './security-test-support.mjs';

const require = createRequire(import.meta.url);
const apiRequire = createRequire(new URL('../apps/api/package.json', import.meta.url));
const ts = require('typescript');
const Redis = apiRequire('ioredis');
const Fastify = apiRequire('fastify');
const websocket = apiRequire('@fastify/websocket');
const WebSocket = createRequire(apiRequire.resolve('@fastify/websocket'))('ws');
const livekit = apiRequire('livekit-server-sdk');
// A separate test instance is the default; never flush a shared database.
const redisUrl = process.env.TEST_REDIS_URL || 'redis://127.0.0.1:16379';
const tag = randomUUID();
const userId = `redis-test-${tag}`;
const channelId = `redis-test-${tag}`;
const presenceKey = `bravechat:voice:channel:${channelId}:0`;
const connections = [];

class TestRedis extends Redis {
  constructor(url, options) {
    super(url, { ...options, connectTimeout: 3000, retryStrategy: () => null });
    this.on('error', () => {});
    connections.push(this);
  }
}
function loadRoute(file, dependencies) {
  const source = readFileSync(new URL(`../apps/api/src/routes/${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, setInterval, clearInterval,
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name === 'node:crypto') return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}
function waitFrame(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('WebSocket event timeout')); }, 5000);
    const listener = (raw) => {
      const event = JSON.parse(raw.toString());
      if (predicate(event)) { cleanup(); resolve(event); }
    };
    const cleanup = () => { clearTimeout(timer); socket.off('message', listener); };
    socket.on('message', listener);
  });
}

test('real Redis: cross-instance realtime and signed voice webhooks', { timeout: 30000 }, async (t) => {
  const redis = new TestRedis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 0 });
  const apps = []; const sockets = [];
  t.after(async () => {
    for (const socket of sockets) socket.terminate();
    await Promise.all(apps.map((app) => app.close()));
    if (redis.status === 'ready') await redis.del(presenceKey);
    for (const connection of connections) connection.disconnect();
  });
  await redis.connect();
  assert.equal(await redis.ping(), 'PONG');
  const info = await redis.info('server');
  console.log(`Redis ${info.match(/redis_version:([^\r\n]+)/)?.[1]} PING PONG`);

  const env = {
    REDIS_ENABLED: 'true', REDIS_URL: redisUrl, LIVEKIT_URL: 'ws://localhost:7880',
    LIVEKIT_API_KEY: 'redis-integration-test', LIVEKIT_API_SECRET: randomUUID() + randomUUID(), LIVEKIT_TOKEN_TTL_SECONDS: 300,
  };
  let userLimit = 1;
  const prisma = {
    refreshToken: { findFirst: async () => ({ id: 'test-session' }) },
    serverMember: { findFirst: async () => ({ id: 'test-member' }) },
    channel: { findFirst: async () => ({ id: channelId, type: 'VOICE', voiceEpoch: 0, userLimit, server: { members: [] } }), update: async () => ({ voiceEpoch: 0 }) },
    voiceSession: { upsert: async () => {}, findUnique: async () => ({ epoch: 0 }) },
  };
  prisma.$transaction = async (work) => work(prisma);
  const dependencies = { ioredis: TestRedis, '../config/env': { env }, '../config/prisma': { prisma }, 'livekit-server-sdk': livekit };
  // Redis, WebSockets, and webhook signatures are real; the SFU control API
  // remains isolated so this suite does not require microphone/media support.
  class RoomServiceClient { async listRooms() { return []; } async updateParticipant() {} async removeParticipant() {} }
  dependencies['../services/voice-security'] = loadModule('services/voice-security.ts', {
    ...dependencies, 'livekit-server-sdk': { ...livekit, RoomServiceClient },
    './conversation': { fail: (statusCode, message) => Object.assign(new Error(message), { statusCode }) },
  });
  const modules = [];
  for (let i = 0; i < 2; i++) {
    const app = Fastify(); apps.push(app);
    app.decorate('authenticate', async (request) => {
      request.user = { id: request.headers['x-test-user'] || userId, sid: 'test-session', username: 'tester', exp: Date.now() / 1000 + 900 };
    });
    app.addContentTypeParser('application/webhook+json', { parseAs: 'string' }, (_request, body, done) => done(null, body));
    await app.register(websocket);
    const realtime = loadRoute('websocket.routes.ts', dependencies);
    modules.push(realtime);
    await realtime.websocketRoutes(app);
    if (i === 0) await loadRoute('voice.routes.ts', dependencies).voiceRoutes(app);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const socket = new WebSocket(`ws://127.0.0.1:${app.server.address().port}/ws`);
    sockets.push(socket);
    await waitFrame(socket, (event) => event.type === 'connected');
  }
  // Ensure both real subscriptions have been acknowledged by Redis before publishing.
  const deadline = Date.now() + 5000;
  while (connections.filter((client) => client.condition.subscriber).length < 2 && Date.now() < deadline) await delay(20);
  assert.equal(connections.filter((client) => client.condition.subscriber).length, 2);

  await t.test('50 server subscriptions and a message relayed between two API instances', async () => {
    for (let i = 0; i < 50; i++) {
      const ack = waitFrame(sockets[1], (event) => event.type === 'server_joined' && event.serverId === `${tag}-${i}`);
      sockets[1].send(JSON.stringify({ type: 'join_server', serverId: `${tag}-${i}` }));
      await ack;
    }
    const incoming = waitFrame(sockets[1], (event) => event.type === 'dm_create' && event.message.id === tag);
    modules[0].publishUserEvent(userId, { type: 'dm_create', message: { id: tag, content: 'real Redis relay' } });
    assert.equal((await incoming).message.content, 'real Redis relay');
    assert.equal(sockets[1].readyState, WebSocket.OPEN);
  });

  const app = apps[0];
  const hook = async (event, identity) => {
    const payload = JSON.stringify({ event, room: { name: `channel:${channelId}:0` }, ...(identity ? { participant: { identity, metadata: JSON.stringify({ sid: 'test-session', channelId }) } } : {}) });
    const token = new livekit.AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
    token.sha256 = createHash('sha256').update(payload).digest('base64');
    const response = await app.inject({ method: 'POST', url: '/webhook', payload, headers: { 'content-type': 'application/webhook+json', authorization: await token.toJwt() } });
    assert.equal(response.statusCode, 200, response.body);
  };
  const join = (id) => app.inject({ method: 'POST', url: `/channels/${channelId}/token`, headers: { 'x-test-user': id } });

  await t.test('signed join/leave webhooks preserve slots for multiple tabs of one user', async () => {
    await hook('participant_joined', `${userId}:tab1`);
    await hook('participant_joined', `${userId}:tab2`);
    assert.equal(await redis.scard(presenceKey), 2);
    assert.ok(await redis.ttl(presenceKey) > 0);
    assert.equal((await join(userId)).statusCode, 200);
    assert.equal((await join('other-user')).statusCode, 409);
    userLimit = 2;
    assert.equal((await join('other-user')).statusCode, 200);
    userLimit = 1;
    await hook('participant_left', `${userId}:tab1`);
    assert.equal((await join('other-user')).statusCode, 409);
    await hook('participant_left', `${userId}:tab2`);
    assert.equal((await join('other-user')).statusCode, 200);
    await hook('participant_joined', `${userId}:tab3`);
    await hook('room_finished');
    assert.equal(await redis.exists(presenceKey), 0);
  });

  await t.test('session revocation reaches sockets on another API instance', async () => {
    const closed = new Promise((resolve) => sockets[1].once('close', (code) => resolve(code)));
    modules[0].revokeSessions(userId);
    assert.equal(await closed, 1008);
  });
});
