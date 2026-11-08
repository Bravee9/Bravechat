import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// Execute the actual route handlers with isolated DB/Redis/LiveKit adapters.
function loadRoute(file, dependencies) {
  const source = readFileSync(new URL(`../apps/api/src/routes/${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, setInterval: () => 0, clearInterval() {},
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name === 'node:crypto') return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test('50 acknowledged server subscriptions stay connected; unbounded bursts are rejected', async () => {
  const { websocketRoutes } = loadRoute('websocket.routes.ts', {
    ioredis: class {}, '../config/env': { env: { REDIS_ENABLED: 'false' } },
    '../config/prisma': { prisma: {
      refreshToken: { findFirst: async () => ({ id: 'session' }) },
      serverMember: { findFirst: async ({ where }) => where.serverId === 'missing' ? null : { id: 'member' } },
    } },
  });
  let handler;
  await websocketRoutes({ authenticate() {}, get: (_path, _options, callback) => { handler = callback; }, log: { warn() {} } });
  class Socket extends EventEmitter {
    readyState = 1;
    send(raw) { this.emit('frame', JSON.parse(raw)); }
    close(code) { this.readyState = 3; this.closeCode = code; this.emit('close'); }
  }
  const socket = new Socket();
  handler(socket, { user: { id: 'u', sid: 'session', username: 'alice', exp: Date.now() / 1000 + 900 } });
  for (let i = 0; i < 50; i++) {
    const frame = new Promise((resolve) => socket.once('frame', resolve));
    socket.emit('message', Buffer.from(JSON.stringify({ type: 'join_server', serverId: i === 5 ? 'missing' : `s${i}` })));
    const result = await frame;
    assert.equal(result.type, i === 5 ? 'server_unavailable' : 'server_joined');
    assert.equal(socket.readyState, 1);
  }
  await new Promise(setImmediate);
  for (let i = 0; i < 31; i++) socket.emit('message', Buffer.from('{"type":"join_server","serverId":"s"}'));
  assert.equal(socket.closeCode, 1008);
});

test('voice capacity counts users across tabs and admits an existing user to a full room', async () => {
  let identities = ['u:tab1', 'u:tab2'];
  let limit = 1;
  class Redis {
    status = 'ready';
    async smembers() { return identities; }
  }
  class AccessToken {
    addGrant() {}
    async toJwt() { return 'test-token'; }
  }
  const { voiceRoutes } = loadRoute('voice.routes.ts', {
    '../services/voice-security': { startVoiceSecurity() {}, admitVoiceParticipant: async () => true, registerVoiceToken: async (id) => `channel:${id}:0` },
    ioredis: Redis,
    'livekit-server-sdk': { AccessToken, TrackSource: { MICROPHONE: 1, CAMERA: 2 } },
    '../config/env': { env: { LIVEKIT_URL: 'ws://test', LIVEKIT_API_KEY: 'key', LIVEKIT_API_SECRET: 'secret' } },
    '../config/prisma': { prisma: { channel: { findFirst: async () => ({ id: 'c', type: 'VOICE', userLimit: limit, server: { members: [] } }) } } },
  });
  let handler;
  await voiceRoutes({ authenticate() {}, addHook() {}, post: (path, _options, callback) => { if (path.endsWith('/token')) handler = callback; } });
  const join = async (id) => {
    let status = 200;
    await handler({ params: { channelId: 'c' }, user: { id, username: id }, log: { error() {} } }, {
      header() {}, status(value) { status = value; return this; }, send() {},
    });
    return status;
  };
  assert.equal(await join('u'), 200);
  assert.equal(await join('other'), 409);
  limit = 2;
  assert.equal(await join('other'), 200);
  identities = ['u:tab2']; // Leaving one tab must not remove the remaining user's slot.
  limit = 1;
  assert.equal(await join('other'), 409);
});
