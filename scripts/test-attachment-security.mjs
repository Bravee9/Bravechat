import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequire, loadModule } from './security-test-support.mjs';

test('attachment downloads reject deleted messages and nonmembers before signing', async (t) => {
  let deleted = false; let signed = 0;
  const prisma = { attachment: { findFirst: async ({ where }) => {
    const member = where.message?.channel?.server?.members?.some?.userId === 'member';
    if (!member || (deleted && where.message?.isDeleted === false)) return null;
    return { r2Key: 'attachments/c/file', filename: 'private.txt', contentType: 'text/plain' };
  } } };
  const { uploadRoutes } = loadModule('routes/upload.routes.ts', {
    '../config/prisma': { prisma }, '../config/env': { env: { MAX_FILE_SIZE: 1024 } },
    '../services/storage.service': { ASSET_RULES: {}, IMAGE_TYPES: new Set(), extensionForType() {}, pendingKey() {}, safeExtension() {} },
  });
  const app = apiRequire('fastify')(); t.after(() => app.close());
  app.decorate('authenticate', async (request) => { request.user = { id: request.headers['x-test-user'] || 'member' }; });
  app.decorate('r2', { storage: { presignGet: async () => { signed++; return 'https://example.invalid/signed'; } } });
  await app.register(uploadRoutes, { prefix: '/uploads' });
  assert.equal((await app.inject('/uploads/file/url')).statusCode, 302);
  assert.equal(signed, 1);
  deleted = true;
  assert.equal((await app.inject('/uploads/file/url')).statusCode, 404);
  deleted = false;
  assert.equal((await app.inject({ url: '/uploads/file/url', headers: { 'x-test-user': 'outsider' } })).statusCode, 404);
  assert.equal(signed, 1);
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
