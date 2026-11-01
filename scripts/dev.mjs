import { createRequire } from 'node:module';
import path from 'node:path';
import { root, apiRequire, prepareDatabase, run } from './runtime.mjs';

try {
  await prepareDatabase();
  const webRoot = path.join(root, 'apps/web');
  const webRequire = createRequire(path.join(webRoot, 'package.json'));
  const children = [
    run(apiRequire.resolve('tsx/cli'), ['watch', 'src/index.ts'], path.join(root, 'apps/api')),
    run(webRequire.resolve('next/dist/bin/next'), ['dev', '-p', '3000'], webRoot),
  ];
  let closing = false;
  const stop = (code = 0) => {
    if (closing) return;
    closing = true;
    children.forEach((child) => child.kill());
    process.exitCode = code;
  };
  children.forEach((child) => {
    child.on('error', (error) => { console.error(error.message); stop(1); });
    child.on('exit', (code) => stop(code ?? 1));
  });
  process.on('SIGINT', () => stop());
  process.on('SIGTERM', () => stop());
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
