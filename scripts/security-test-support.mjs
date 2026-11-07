import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export const apiRequire = createRequire(new URL('../apps/api/package.json', import.meta.url));
const ts = createRequire(import.meta.url)('typescript');

// Exercise real handlers with isolated infrastructure; never load project .env.
export function loadModule(file, dependencies) {
  const source = readFileSync(new URL(`../apps/api/src/${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Buffer, URL, setInterval, clearInterval, setTimeout, clearTimeout,
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith('.')) throw new Error(`Missing test dependency: ${name}`);
      return apiRequire(name);
    },
  });
  return exports;
}
