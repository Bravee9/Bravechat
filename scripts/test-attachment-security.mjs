import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequire, loadModule } from './security-test-support.mjs';

test('attachment downloads and presign enforce private-channel ACL, attach_files RBAC, and DM block checks', async (t) => {
  let deleted = false; let signed = 0; let privateDenied = false; let hasAttachFiles = true; let isBlockedDm = false;
  const prisma = {
    attachment: {
      findFirst: async ({ where }) => {
        const member = where.message?.channel?.server?.members?.some?.userId === 'member';
        if (!member || (deleted && where.message?.isDeleted === false)) return null;
        return { r2Key: 'attachments/c/file', filename: 'private.txt', contentType: 'text/plain', message: { channelId: 'c' } };
      },
    },
    channel: {
      findFirst: async ({ where }) => (where.id === 'c' ? { id: 'c' } : null),
    },
    user: {
      findFirst: async ({ where }) => (where.id === 'dm-peer' ? { id: 'dm-peer' } : null),
    },
  };
  const { uploadRoutes } = loadModule('routes/upload.routes.ts', {
    '../config/prisma': { prisma },
    '../config/env': { env: { MAX_FILE_SIZE: 1024 } },
    '../services/storage.service': {
      ASSET_RULES: {},
      IMAGE_TYPES: new Set(['image/png']),
      extensionForType() { return '.txt'; },
      pendingKey(u, ext) { return `pending/${u}/k${ext}`; },
      safeExtension() { return '.txt'; },
    },
    '../services/permissions': {
      canAccessChannel: async (channelId, userId) => {
        if (channelId !== 'c' || userId !== 'member' || privateDenied) return null;
        return { id: 'c', serverId: 's1', canSend: true };
      },
      getMemberPermissions: async () => ({
        hasPermission: (key) => (key === 'attach_files' ? hasAttachFiles : true),
      }),
    },
    '../services/conversation': {
      blocked: async () => isBlockedDm,
    },
  });
  const app = apiRequire('fastify')(); t.after(() => app.close());
  app.decorate('authenticate', async (request) => { request.user = { id: request.headers['x-test-user'] || 'member' }; });
  app.decorate('r2', {
    storage: {
      presignGet: async () => { signed++; return 'https://example.invalid/signed'; },
      presignPut: async () => 'https://example.invalid/put',
    },
  });
  await app.register(uploadRoutes, { prefix: '/uploads' });
  assert.equal((await app.inject('/uploads/file/url')).statusCode, 302);
  assert.equal(signed, 1);
  deleted = true;
  assert.equal((await app.inject('/uploads/file/url')).statusCode, 404);
  deleted = false;
  privateDenied = true;
  assert.equal((await app.inject('/uploads/file/url')).statusCode, 404);
  privateDenied = false;
  assert.equal((await app.inject({ url: '/uploads/file/url', headers: { 'x-test-user': 'outsider' } })).statusCode, 404);
  assert.equal(signed, 1);

  // Presign enforces attach_files permission and private channel access
  hasAttachFiles = false;
  const noAttachRes = await app.inject({
    method: 'POST',
    url: '/uploads/presign',
    payload: { purpose: 'attachment', channelId: 'c', filename: 'a.txt', contentType: 'text/plain', size: 10 },
  });
  assert.equal(noAttachRes.statusCode, 403);
  hasAttachFiles = true;

  // Presign for DM checks blocked relationship
  isBlockedDm = true;
  const blockedDmRes = await app.inject({
    method: 'POST',
    url: '/uploads/presign',
    payload: { purpose: 'attachment', channelId: 'dm-peer', filename: 'a.txt', contentType: 'text/plain', size: 10 },
  });
  assert.equal(blockedDmRes.statusCode, 403);
});

test('StorageService.presignGet forces attachment disposition for non-inline MIME types', async () => {
  let lastCommand;
  let lastOptions;
  const { StorageService } = loadModule('services/storage.service.ts', {
    '../config/env': { env: { STORAGE_ENABLED: true, R2_BUCKET_NAME: 'b', R2_ENDPOINT_URL: 'http://localhost:9000', R2_ACCESS_KEY_ID: 'k', R2_SECRET_ACCESS_KEY: 's' } },
    '@aws-sdk/s3-request-presigner': {
      getSignedUrl: async (_s3, command, options) => {
        lastCommand = command;
        lastOptions = options;
        return 'https://example.invalid/signed';
      },
    },
  });
  const storage = new StorageService({});
  await storage.presignPut('pending/u/1.txt', 'text/plain', 12, 600);
  assert.equal(lastOptions.signableHeaders.has('content-type'), true);

  await storage.presignGet('attachments/c/evil.html', { filename: 'evil.html', contentType: 'text/html' });
  assert.equal(lastCommand.input.ResponseContentDisposition, 'attachment; filename="evil.html"');
  assert.equal(lastCommand.input.ResponseContentType, 'application/octet-stream');
});

test('soft-deleted rows cannot leak content or attachment URLs through nonce retries', async () => {
  const { serializeMessage } = loadModule('services/conversation.ts', {
    '../config/prisma': { prisma: {} }, '../config/env': { env: { STORAGE_ENABLED: true } },
    './storage.service': { mediaUrl: () => null },
  });
  let signed = false;
  await assert.rejects(() => serializeMessage({ r2: { storage: { presignGet: async () => { signed = true; } } } }, {
    id: 'deleted', isDeleted: true, content: 'private', attachments: [{ r2Key: 'attachments/private' }],
  }), { statusCode: 410 });
  assert.equal(signed, false);
});
