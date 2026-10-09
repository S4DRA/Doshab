import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Same transpile-and-isolate approach as existing tests, with local import support.
export function interactionModule(file, { globals = {}, mocks = {} } = {}) {
  const cache = new Map();
  function load(filename) {
    const path = resolve(filename);
    if (cache.has(path)) return cache.get(path);
    if (path.endsWith(".json")) return JSON.parse(readFileSync(path, "utf8"));
    const loadedModule = { exports: {} };
    cache.set(path, loadedModule.exports);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, {
      module: loadedModule, exports: loadedModule.exports, ...globals,
      require(specifier) {
        if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
        if (specifier.startsWith(".")) return load(resolve(dirname(path), specifier.endsWith(".json") ? specifier : `${specifier}.ts`));
        return require(specifier);
      },
    }, { filename: path });
    return loadedModule.exports;
  }
  return load(file);
}
