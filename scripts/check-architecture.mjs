import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"];
const ASSET_EXTENSIONS = [".css", ".scss", ".sass", ".less", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".woff", ".woff2", ".ttf", ".otf"];

function slash(value) { return value.split(path.sep).join("/"); }

function sourceFiles(root) {
  const files = [];
  for (const sourceRoot of ["app", "src", "worker", "scripts"]) {
    const directory = path.join(root, sourceRoot);
    if (!fs.existsSync(directory)) continue;
    const visit = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const target = path.join(current, entry.name);
        if (entry.isDirectory()) visit(target);
        else if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) files.push(slash(path.relative(root, target)));
      }
    };
    visit(directory);
  }
  return files.sort();
}

function compilerOptions(root) {
  const configFile = path.join(root, "tsconfig.json");
  if (!fs.existsSync(configFile)) return {};
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  return ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
}

function resolveDependency(root, importer, specifier, options) {
  const resolved = ts.resolveModuleName(specifier, path.join(root, importer), options, ts.sys).resolvedModule;
  if (!resolved && specifier.startsWith(".")) {
    const candidate = path.resolve(root, path.dirname(importer), specifier);
    const localFile = [candidate, ...ASSET_EXTENSIONS.map((extension) => `${candidate}${extension}`)]
      .find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
    if (localFile) {
      const relative = slash(path.relative(root, localFile));
      if (!relative.startsWith("../") && !path.isAbsolute(relative)) return { to: relative, external: false };
    }
  }
  if (!resolved || resolved.isExternalLibraryImport) return { to: null, external: true };
  const relative = slash(path.relative(root, resolved.resolvedFileName));
  if (relative.startsWith("../") || path.isAbsolute(relative) || relative.startsWith("node_modules/")) return { to: null, external: true };
  return { to: relative, external: false };
}

function importsFor(root, file) {
  const contents = fs.readFileSync(path.join(root, file), "utf8");
  const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true);
  const imports = [];
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) imports.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return imports;
}

export function analyzeArchitecture(root = ROOT, policy = JSON.parse(fs.readFileSync(path.join(root, "architecture-policy.json"), "utf8"))) {
  const files = sourceFiles(root);
  const options = compilerOptions(root);
  const edges = files.flatMap((from) => importsFor(root, from).map((specifier) => ({ from, specifier, ...resolveDependency(root, from, specifier, options) })));
  const violations = [];
  const add = (rule, edge) => violations.push({ rule, ...edge });

  for (const edge of edges) {
    for (const rule of policy.rules) {
      if (!new RegExp(rule.from).test(edge.from)) continue;
      if (edge.to && rule.to && new RegExp(rule.to).test(edge.to)) add(rule.name, edge);
      if (edge.external && rule.external && new RegExp(rule.external).test(edge.specifier)) add(rule.name, edge);
    }

    const sourceFeature = edge.from.match(/^src\/features\/([^/]+)\//)?.[1];
    const targetFeature = edge.to?.match(/^src\/features\/([^/]+)\//)?.[1];
    if (sourceFeature && targetFeature && sourceFeature !== targetFeature && edge.to !== `src/features/${targetFeature}/public.ts`) add("features-must-use-public-contracts", edge);
    if (sourceFeature && edge.to?.startsWith("src/application/") && !policy.featureApplicationContracts.includes(edge.to)) add("features-must-use-action-contracts", edge);
  }

  const outgoing = new Map();
  for (const edge of edges) if (edge.to) outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  const pending = policy.runtimeRoots.filter((file) => files.includes(file));
  const reached = new Set(pending);
  while (pending.length) {
    for (const edge of outgoing.get(pending.pop()) ?? []) {
      const isNodeAuthoring = policy.nodeAuthoringModules.includes(edge.to)
        || (policy.nodeAuthoringPatterns ?? []).some((pattern) => new RegExp(pattern).test(edge.to));
      if (isNodeAuthoring) add("runtime-must-not-reach-node-authoring", edge);
      if (!reached.has(edge.to)) { reached.add(edge.to); pending.push(edge.to); }
    }
  }
  const nodeBuiltins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
  for (const edge of edges) if (reached.has(edge.from) && !edge.to && nodeBuiltins.has(edge.specifier)) add("runtime-must-not-import-node-builtins", edge);
  return violations;
}

export function formatViolation(violation) {
  return `Architecture violation: ${violation.from} imports ${violation.to ?? violation.specifier}\nRule: ${violation.rule}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = analyzeArchitecture();
  if (violations.length) {
    console.error(violations.map(formatViolation).join("\n\n"));
    process.exitCode = 1;
  } else console.log("Architecture policy passed (fresh dependency analysis of current source). ");
}
