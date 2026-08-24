import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const pagesDirectory = path.join(rootDirectory, "dist-pages");
const liveDirectory = path.join(rootDirectory, "dist");
const pagesBasePath = "/crawler-command-interface/";

function readRequiredFile(filePath) {
  assert.ok(fs.existsSync(filePath), `Expected build artifact: ${filePath}`);
  return fs.readFileSync(filePath, "utf8");
}

test("live-app build retains the Sites Worker capture contract", () => {
  const workerPath = path.join(liveDirectory, "server", "index.js");
  const packagedHostingPath = path.join(liveDirectory, ".openai", "hosting.json");
  const sourceHostingPath = path.join(rootDirectory, ".openai", "hosting.json");
  const provenancePath = path.join(liveDirectory, "build-provenance.json");

  assert.ok(fs.existsSync(workerPath), "Expected a Worker entry point at dist/server/index.js");
  assert.ok(fs.existsSync(packagedHostingPath), "Expected packaged Sites hosting metadata");

  assert.deepEqual(
    JSON.parse(readRequiredFile(packagedHostingPath)),
    JSON.parse(readRequiredFile(sourceHostingPath)),
    "The captured live-app artifact must retain its hosting identity",
  );

  const provenance = JSON.parse(readRequiredFile(provenancePath));
  assert.equal(provenance.target, "live");
  assert.match(provenance.commitSha, /^[0-9a-f]{7,40}$/i);
});

test("GitHub Pages build is a self-contained static application", () => {
  const indexPath = path.join(pagesDirectory, "index.html");
  const provenancePath = path.join(pagesDirectory, "build-provenance.json");
  const html = readRequiredFile(indexPath);

  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /<title>Crawler Command Interface<\/title>/);
  assert.doesNotMatch(html, /src\/main\.pages\.tsx/);

  const localAssetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith(pagesBasePath));

  assert.ok(localAssetUrls.length > 0, "Expected the Pages HTML to reference emitted static assets");

  for (const url of localAssetUrls) {
    const artifactPath = path.join(
      pagesDirectory,
      url.slice(pagesBasePath.length),
    );
    assert.ok(fs.existsSync(artifactPath), `Expected emitted static asset: ${url}`);
  }

  const provenance = JSON.parse(readRequiredFile(provenancePath));
  assert.equal(provenance.target, "pages");
  assert.match(provenance.commitSha, /^[0-9a-f]{7,40}$/i);
});

test("both deployment targets capture the same source commit", () => {
  const liveProvenance = JSON.parse(
    readRequiredFile(path.join(liveDirectory, "build-provenance.json")),
  );
  const pagesProvenance = JSON.parse(
    readRequiredFile(path.join(pagesDirectory, "build-provenance.json")),
  );

  assert.equal(liveProvenance.commitSha, pagesProvenance.commitSha);
});
