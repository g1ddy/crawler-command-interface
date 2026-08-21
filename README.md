# Crawler Command Interface

A replayable dungeon-crawler command interface with one browser application and
two deployment adapters. The ChatGPT live app continues to run as a
[vinext](https://github.com/cloudflare/vinext) Cloudflare Worker, while a static
Vite bundle can be hosted on GitHub Pages.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Local development

```bash
npm ci
npm run dev
```

`npm run dev` runs the ChatGPT live-app adapter. To preview the Pages adapter,
run `npx vite --config vite.pages.config.ts`; its default base URL is
`/crawler-command-interface/`.

## Architecture and build targets

- `src/CrawlerApp.tsx` is the shared, browser-only React application.
- `app/page.tsx` is the deliberately thin ChatGPT Sites/Vinext adapter.
- `src/main.pages.tsx` and `index.html` mount the same application as a static
  client-side Vite app.
- `npm run build:live` produces the Worker-compatible live-app artifact in
  `dist/`.
- `npm run build:pages` produces the static Pages artifact in `dist-pages/`.
- `npm run build` remains an alias for `build:live`, preserving the existing
  ChatGPT hosting contract.
- `npm run verify` runs lint, domain unit tests, and both production builds.

The Pages base defaults to `/crawler-command-interface/`. Set
`PAGES_BASE_PATH=/` when building for a custom domain or user/organization Pages
site. The current UI has no client-side routes, so GitHub Pages does not require
a `404.html` fallback; add one before introducing history-based routes.

## Continuous integration and deployment

Pull requests and pushes to `main` run `.github/workflows/ci.yml`, which verifies
both targets from the same checkout. Pushes to `main` also run
`.github/workflows/deploy-pages.yml`, upload `dist-pages/` as a Pages artifact,
and deploy it with GitHub's official Pages Actions. In the repository settings,
set **Pages → Build and deployment → Source** to **GitHub Actions**.

The workflow does not alter the existing ChatGPT release mechanism. Build the
live app from the same reviewed `main` commit with `npm run build:live`, and
record that commit SHA in the live-app release or deployment metadata.

## Sites lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build` / `npm run build:live`: build the deployable Sites artifact
- `npm run build:pages`: build the static GitHub Pages artifact
- `npm run verify`: lint, run unit tests, and build both deployment targets
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
