import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import { apiRequire, loadModule } from './security-test-support.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

function loadRoute(file, dependencies) {
  const source = readFileSync(new URL(`../apps/api/src/routes/${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    setInterval: () => 0,
    clearInterval() {},
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name === 'node:crypto') return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test('RBAC hierarchy blocks privilege escalation, unheld bitmask grants, and peer/superior moderation', async (t) => {
  // Actor holds manage_roles (1<<2) and kick_members (1<<5) at position 50
  const actorMask = (1 << 2) | (1 << 5);
  const roleTable = {
    'role-admin': { id: 'role-admin', serverId: 's1', name: 'Admin', position: 80, permissions: BigInt(0x7fff), isManaged: true },
    'role-mod': { id: 'role-mod', serverId: 's1', name: 'Moderator', position: 50, permissions: BigInt(actorMask), isManaged: false },
    'role-junior': { id: 'role-junior', serverId: 's1', name: 'Helper', position: 10, permissions: BigInt(1 << 7), isManaged: false },
  };
  const memberTable = {
    'u-mod': { id: 'm-mod', serverId: 's1', userId: 'u-mod', isOwner: false, isBanned: false, roles: [{ roleId: 'role-mod', role: roleTable['role-mod'] }] },
    'u-admin': { id: 'm-admin', serverId: 's1', userId: 'u-admin', isOwner: false, isBanned: false, roles: [{ roleId: 'role-admin', role: roleTable['role-admin'] }] },
  };

  const permissionsModule = {
    PERMISSION_BITS: {
      manage_server: 1 << 0, manage_channels: 1 << 1, manage_roles: 1 << 2, view_audit_log: 1 << 3,
      invite_members: 1 << 4, kick_members: 1 << 5, ban_members: 1 << 6, send_messages: 1 << 7,
      attach_files: 1 << 8, manage_messages: 1 << 9, pin_messages: 1 << 10, connect_voice: 1 << 11,
      speak_voice: 1 << 12, share_screen: 1 << 13, access_private_channels: 1 << 14,
    },
    permissionsToBitmask: (perms) => {
      let m = 0;
      for (const [k, b] of Object.entries(permissionsModule.PERMISSION_BITS)) if (perms[k]) m |= b;
      return String(m);
    },
    bitmaskToPermissions: () => ({}),
    hexToRgbInt: () => 0x087cfa,
    rgbIntToHex: () => '#087CFA',
    ensureDefaultServerRoles: async () => [],
    writeAuditLog: async () => {},
    getMemberPermissions: async (_serverId, userId) => {
      const m = memberTable[userId];
      if (!m) return null;
      return {
        member: m,
        isOwner: false,
        roleIds: m.roles.map((r) => r.roleId),
        mask: actorMask,
        highestRolePosition: 50,
        permissions: {},
        hasPermission: (key) => (actorMask & permissionsModule.PERMISSION_BITS[key]) === permissionsModule.PERMISSION_BITS[key],
      };
    },
  };

  const prisma = {
    role: {
      findFirst: async ({ where }) => roleTable[where.id] ?? null,
      findMany: async ({ where }) => (where.id?.in ?? []).map((id) => roleTable[id]).filter(Boolean),
    },
    serverMember: {
      findFirst: async ({ where }) => memberTable[where.userId] ?? null,
    },
    $transaction: async (work) => work(prisma),
  };

  const { roleRoutes } = loadRoute('role.routes.ts', {
    '../config/prisma': { prisma },
    './websocket.routes': { revokeServerMembership() {} },
    '../services/voice-security': { revokeVoiceSessions: async () => {} },
    '../services/permissions': permissionsModule,
    zod: apiRequire('zod'),
  });

  const app = apiRequire('fastify')();
  t.after(() => app.close());
  app.decorate('authenticate', async (request) => {
    request.user = { id: request.headers['x-test-user'] || 'u-mod' };
  });
  await app.register(roleRoutes, { prefix: '/servers' });

  // 1. Creating role with unheld ban_members permission is rejected (403)
  const createEsc = await app.inject({
    method: 'POST',
    url: '/servers/s1/roles',
    payload: { name: 'Rogue', permissions: { ban_members: true } },
  });
  assert.equal(createEsc.statusCode, 403);

  // 2. Patching a higher-positioned role (Admin pos 80 > actor pos 50) is rejected (403)
  const patchHigher = await app.inject({
    method: 'PATCH',
    url: '/servers/s1/roles/role-admin',
    payload: { name: 'Hacked' },
  });
  assert.equal(patchHigher.statusCode, 403);

  // 3. Patching a lower role to add an unheld permission (manage_server) is rejected (403)
  const patchEsc = await app.inject({
    method: 'PATCH',
    url: '/servers/s1/roles/role-junior',
    payload: { permissions: { send_messages: true, manage_server: true } },
  });
  assert.equal(patchEsc.statusCode, 403);

  // 4. Assigning a higher role or editing a superior member's roles is rejected (403)
  const assignSuperior = await app.inject({
    method: 'PUT',
    url: '/servers/s1/members/u-admin/roles',
    payload: { roleIds: ['role-junior'] },
  });
  assert.equal(assignSuperior.statusCode, 403);

  // 5. Kicking a superior member (Admin pos 80) is rejected (403)
  const kickSuperior = await app.inject({
    method: 'POST',
    url: '/servers/s1/members/u-admin/kick',
  });
  assert.equal(kickSuperior.statusCode, 403);
});

test('WebSocket join_channel rejects unauthorized members attempting to eavesdrop on private channels', async () => {
  const { websocketRoutes } = loadRoute('websocket.routes.ts', {
    ioredis: class {},
    '../config/env': { env: { REDIS_ENABLED: 'false' } },
    '../config/prisma': {
      prisma: {
        refreshToken: { findFirst: async () => ({ id: 'session' }) },
        channel: {
          findFirst: async ({ where }) => {
            if (where.id === 'private-ch') {
              return { id: 'private-ch', serverId: 's1', isPrivate: true, rolePermissions: [{ roleId: 'role-admin' }] };
            }
            return null;
          },
        },
        serverMember: {
          findFirst: async ({ where }) => {
            if (where.userId === 'u-member') {
              return { isOwner: false, roles: [{ roleId: 'role-member', role: { permissions: BigInt(1 << 7) } }] };
            }
            if (where.userId === 'u-admin') {
              return { isOwner: false, roles: [{ roleId: 'role-admin', role: { permissions: BigInt(1 << 7) } }] };
            }
            return null;
          },
        },
      },
    },
  });

  let handler;
  await websocketRoutes({ authenticate() {}, get: (_p, _o, cb) => { handler = cb; }, log: { warn() {} } });

  class Socket extends EventEmitter {
    readyState = 1;
    frames = [];
    send(raw) { this.frames.push(JSON.parse(raw)); this.emit('frame', JSON.parse(raw)); }
    close(code, reason) { this.readyState = 3; this.closeCode = code; this.closeReason = reason; this.emit('close'); }
  }

  // Unauthorized member tries to join private channel -> closed 1008
  const memberSock = new Socket();
  handler(memberSock, { user: { id: 'u-member', sid: 'session', username: 'bob', exp: Date.now() / 1000 + 900 } });
  const closed = new Promise((resolve) => memberSock.once('close', resolve));
  memberSock.emit('message', Buffer.from(JSON.stringify({ type: 'join_channel', channelId: 'private-ch' })));
  await closed;
  assert.equal(memberSock.closeCode, 1008);

  // Authorized role succeeds
  const adminSock = new Socket();
  handler(adminSock, { user: { id: 'u-admin', sid: 'session', username: 'alice', exp: Date.now() / 1000 + 900 } });
  const joined = new Promise((resolve) => adminSock.once('frame', (f) => { if (f.type === 'channel_joined') resolve(f); }));
  adminSock.emit('message', Buffer.from(JSON.stringify({ type: 'join_channel', channelId: 'private-ch' })));
  const ack = await joined;
  assert.equal(ack.channelId, 'private-ch');
});

test('Permission cache never retains negative results and clears immediately upon invalidation', async () => {
  let isMember = true;
  const prisma = {
    serverMember: {
      findFirst: async () => (isMember ? { id: 'm1', isOwner: false, roles: [] } : null),
    },
  };
  const permsService = loadModule('services/permissions.ts', {
    '@prisma/client': { Prisma: {} },
    '../config/prisma': { prisma },
  });

  assert.ok(await permsService.getMemberPermissions('s-cache', 'u1'));
  isMember = false;
  // Cached within 5s TTL until invalidated
  assert.ok(await permsService.getMemberPermissions('s-cache', 'u1'));
  // Leaving/kicking/banning calls invalidateServerPermissionsCache -> denied immediately
  permsService.invalidateServerPermissionsCache('s-cache');
  assert.equal(await permsService.getMemberPermissions('s-cache', 'u1'), null);
});

test('message-action routes enforce private channel access and allow manage_messages moderators to delete', async (t) => {
  let canAccess = false;
  let hasManageMessages = false;
  let deletedId = null;
  const prisma = {
    message: {
      findFirst: async ({ where }) => ({
        id: where.id,
        channelId: 'priv-ch',
        authorId: 'u-author',
        content: 'hello',
        isDeleted: false,
        channel: { serverId: 's1', server: { ownerId: 'u-owner' } },
      }),
      update: async ({ where }) => { deletedId = where.id; return {}; },
    },
  };
  const { messageActionRoutes } = loadRoute('message-action.routes.ts', {
    '../config/prisma': { prisma },
    '../services/conversation': {
      blocked: async () => false,
      dmInclude: {},
      fail: (statusCode, message) => Object.assign(new Error(message), { statusCode }),
      messageInclude: {},
      pairFilter: () => ({}),
      serializeMessage: async (_s, row) => row,
    },
    './websocket.routes': { publishChannelEvent() {}, publishUserEvent() {} },
    '../services/permissions': {
      canAccessChannel: async () => (canAccess ? { id: 'priv-ch', serverId: 's1' } : null),
      getMemberPermissions: async () => ({
        hasPermission: (key) => (key === 'manage_messages' ? hasManageMessages : false),
      }),
    },
    zod: apiRequire('zod'),
  });

  const app = apiRequire('fastify')();
  t.after(() => app.close());
  app.addHook('preHandler', async (request) => {
    request.user = { id: request.headers['x-test-user'] || 'u-mod' };
  });
  await app.register(messageActionRoutes, { prefix: '/messages' });

  // 1. Member without private channel access gets 404 when attempting to react or delete
  const deniedDelete = await app.inject({ method: 'DELETE', url: '/messages/msg-1' });
  assert.equal(deniedDelete.statusCode, 404);

  // 2. Member with private channel access but without manage_messages gets 403
  canAccess = true;
  const unprivDelete = await app.inject({ method: 'DELETE', url: '/messages/msg-1' });
  assert.equal(unprivDelete.statusCode, 403);

  // 3. Moderator with manage_messages can delete another user's message (200)
  hasManageMessages = true;
  const modDelete = await app.inject({ method: 'DELETE', url: '/messages/msg-1' });
  assert.equal(modDelete.statusCode, 200);
  assert.equal(deletedId, 'msg-1');
});
