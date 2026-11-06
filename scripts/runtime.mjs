import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const apiRequire = createRequire(path.join(root, 'apps/api/package.json'));
apiRequire('dotenv').config({ path: path.join(root, '.env') });

export function run(cli, args, cwd = root, options = {}) {
  return spawn(process.execPath, [cli, ...args], { cwd, env: process.env, stdio: 'inherit', windowsHide: true, ...options });
}
export async function prepareDatabase() {
  // Tự động kiểm tra và khởi chạy các Docker containers cần thiết nếu dùng Docker
  try {
    await new Promise((resolve) => {
      const child = spawn('docker', ['compose', 'up', '-d', 'postgres', 'redis', 'livekit'], {
        cwd: root,
        stdio: 'ignore',
        shell: true,
      });
      child.on('exit', () => resolve());
      child.on('error', () => resolve());
    });
  } catch {
    // Bỏ qua nếu môi trường dùng PostgreSQL native ngoài Docker
  }

  if (process.platform === 'win32' && existsSync(path.join(root, '.local/pgdata/PG_VERSION'))) {
    const code = await new Promise((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-File', path.join(root, 'scripts/local-db.ps1')], { cwd: root, env: process.env, stdio: 'inherit', windowsHide: true });
      child.on('error', reject);
      child.on('exit', resolve);
    });
    if (code !== 0) throw new Error('Could not start the project database. Check .local/postgres.log.');
  }
  const cli = apiRequire.resolve('prisma/build/index.js');
  let needsGeneration = true;
  try {
    const clientRequire = createRequire(apiRequire.resolve('@prisma/client'));
    const generated = path.join(path.dirname(clientRequire.resolve('.prisma/client/package.json')), 'schema.prisma');
    // Prisma formats whitespace when generating its schema copy. Preserve string literals.
    const normalize = (value) => value.replace(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\s+/g, (token) => token.startsWith('"') ? token : '');
    needsGeneration = normalize(readFileSync(generated, 'utf8')) !== normalize(readFileSync(path.join(root, 'packages/database/prisma/schema.prisma'), 'utf8'));
  } catch { /* A fresh install still needs client generation. */ }
  // Windows locks the query-engine DLL while an API process uses it.
  const commands = [...(needsGeneration ? [['generate']] : []), ['migrate', 'deploy']];
  for (const args of commands) {
    const code = await new Promise((resolve, reject) => {
      const child = run(cli, [...args, '--schema=packages/database/prisma/schema.prisma']);
      child.on('error', reject);
      child.on('exit', resolve);
    });
    if (code !== 0) throw new Error(`Prisma ${args.join(' ')} failed. Check PostgreSQL/DATABASE_URL; stop the API before regenerating the Windows Prisma engine.`);
  }
}
export { root, apiRequire };
