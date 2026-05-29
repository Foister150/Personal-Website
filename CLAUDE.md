# CLAUDE.md

Guidance for Claude when working in this repository.

## What this repo is

Two sites living in one Git repo, served by a single Caddy container behind Docker Compose:

1. **Static portfolio** — `landonfoister.com`. Hand-written HTML/CSS/JS at the repo root. No build step.
2. **Blog** — `blog.landonfoister.com`. Docusaurus 3 (TypeScript) in `blog-site/`. Built once inside a multi-stage Docker image, then served as static files.

The two sites share design tokens but are otherwise independent. Edits to one must not bleed into the other.

A previous iteration of this repo used Astro 6 in `web/` to "componentize" the static site. That experiment was reverted in 2026-05 — the site is small, won't grow huge, and a build step was unnecessary overhead. The repo-root HTML files are the **sole source of truth** for the static portfolio.

## Repository layout

```
/
├── index.html                 ← homepage
├── projects/index.html        ← Coordinate + Home Lab; embeds the sandbox terminal
├── certifications/index.html
├── resume/index.html          ← meta-refresh to /assets/landon-foister-resume-public.pdf
├── blog/index.html            ← meta-refresh to https://blog.landonfoister.com/
├── visual-board/              ← standalone /visual-board/ page (own CSS, no shared header)
├── assets/
│   ├── site.css               ← canonical design tokens + components (~1,350 lines)
│   ├── site.js                ← nav toggle, small interactions
│   ├── graph.js               ← canvas-driven knowledge graph on the homepage
│   ├── terminal.js            ← Coordinate sandbox terminal driver (used by /projects/)
│   ├── favicon.svg, favicon.ico
│   └── landon-foister-resume-public.pdf
├── blog-site/                 ← Docusaurus app (blog.landonfoister.com)
│   ├── docusaurus.config.ts
│   ├── blog/                  ← Markdown posts + authors.yml
│   ├── src/
│   │   ├── css/custom.css     ← Infima overrides + ported site.css rules
│   │   ├── components/        ← StatusBar, PageHero
│   │   └── theme/             ← BlogListPage wrapper (safe swizzle)
│   └── static/
├── Dockerfile                 ← multi-stage: node:22-alpine builds blog → caddy:2-alpine serves
├── Caddyfile                  ← Host-header routes blog.* to /srv/blog, everything else to /srv/static
├── docker-compose.yml         ← `web` (Caddy) on host port 80 + `cloudflared` tunnel sidecar
└── .dockerignore
```

## Design tokens (keep in sync between both sites)

Source: `assets/site.css` (top of file). Mirror any token change in `blog-site/src/css/custom.css`.

- `--void: #080808`, `--raised: #0d0d0d`, `--paper: #f2f0ea`, `--red: #ff3b32`, `--grey: #737373`
- Fonts (Google Fonts): Space Grotesk (display), IBM Plex Mono (mono), Inter (body)
- Nav: bracketed/numbered `01 PROJECTS / 02 CERTIFICATIONS / 03 RESUME / 04 BLOG`, mono, uppercase
- Recurring primitives: `.panel-id`, `.status-bar`, `.page-hero`, `.tag`, `.meta-list`, `.button`

## Running locally

The whole stack runs in one Docker Compose service:

```bash
docker compose up --build
```

Then open:
- http://landonfoister.localhost/ → static portfolio
- http://blog.landonfoister.localhost/ → Docusaurus blog

The `.localhost` TLD resolves to 127.0.0.1 on modern macOS/Linux/Windows — no `/etc/hosts` edits needed. Caddy routes by Host header on a single `:80` listener inside the container.

### Editing the static site

Static files (`index.html`, `projects/`, `certifications/`, `resume/`, `visual-board/`, `blog/`, `assets/`) are **bind-mounted** read-only into the container at `/srv/static/`. Edits show up on the next browser reload — no rebuild needed.

### Editing the blog

The blog build is **baked into the image** at `/srv/blog`. After editing anything under `blog-site/`, rebuild:

```bash
docker compose up --build
```

For faster iteration on blog posts, run the Docusaurus dev server directly:

```bash
cd blog-site
npm install        # first time only
npm start          # dev server at http://localhost:3000/
```

Then rebuild the docker image once you're ready to test the production output.

## Working rules

- **Static site is plain HTML.** No Astro, no React, no build step. Edit `.html` files directly. Each page repeats the `<head>` boilerplate and the site header inline — that's intentional. Don't try to "DRY" it out with a templating system.
- **Never run `npm` from the repo root.** `package.json` only lives in `blog-site/`.
- **Astro/`web/` is gone.** Do not recreate it. If you see references to `web/src/...` in old commits or documentation, they're historical.
- **Don't swizzle Docusaurus `Layout` or `Root`.** They are flagged unsafe and break on upgrade. Prefer:
  1. CSS overrides via `blog-site/src/css/custom.css`
  2. Pseudo-elements (`::before`, `::after`) for static label/chip text
  3. Wrap swizzles (`@theme-original/...` re-export pattern), e.g. `src/theme/BlogListPage/index.tsx`
  4. Eject swizzles only as a last resort, and document the Docusaurus version they were taken from
- **Blog posts are MDX**, even with the `.md` extension. Use `{/* truncate */}` (JSX comment) as the truncate marker, not `<!-- truncate -->`.
- **Coordinate sandbox terminal** is in `assets/terminal.js` and driven by markup already present in `projects/index.html` (the `#coordinate-shell` article). The script is plain JS and looks up DOM elements by ID — leave the ID names alone. CSS lives in `assets/site.css` under `.term-*` / `.log-*` / `.project-terminal`.
- **The user's domain is `landonfoister.com`**, not `foister.com`. The GitHub handle is `Foister150`, which has misled past sessions.

## Docker stack details

- **Image**: built from `./Dockerfile`. Stage 1 runs `npm ci && npm run build` in `node:22-alpine`. Stage 2 is `caddy:2-alpine` with the blog build copied to `/srv/blog` and the Caddyfile at `/etc/caddy/Caddyfile`.
- **Caddyfile**: a single `:80` site block with two `handle` matchers. `auto_https off` because TLS is intended to terminate at Cloudflare's edge via a Cloudflare Tunnel — Caddy runs HTTP-only.
- **docker-compose.yml**: two services. `web` (Caddy) publishes `80:80` and bind-mounts every static dir into `/srv/static/` read-only. `cloudflared` runs the Cloudflare Tunnel and reads `TUNNEL_TOKEN` from `.env` (gitignored). The blog content is *not* bind-mounted; it comes from the baked image layer.
- **.dockerignore**: excludes `.git`, `node_modules`, `build`, `dist`, `.docusaurus`, `README.md`, `CLAUDE.md`, etc., to keep the build context small.

## Current state (2026-05-27)

Working:
- Repo-root static site is the source of truth.
- `Dockerfile` + `Caddyfile` + `docker-compose.yml` + `.dockerignore` produce a working two-host stack.
- `assets/terminal.js` drives the Coordinate sandbox terminal markup that lives in `projects/index.html`.
- `blog/index.html` is a meta-refresh redirect to `https://blog.landonfoister.com/` — keeps the existing `04 BLOG` nav links working without per-page edits.
- Docusaurus blog at `blog-site/` is unchanged from previous work. Dark-mode locked, cyber-brutalist theme, three nav links back to `landonfoister.com`, one stub post (`2026-05-25-first-transmission`).

Not done (deferred):
- **Hosting** — the user wants to self-host on a **Proxmox VM** behind a **Cloudflare Tunnel**. They haven't researched the specifics yet. See the "Future research TODO" in `~/.claude/plans/lucky-booping-parasol.md` and the earlier Pi 5 draft at `~/.claude/plans/scalable-percolating-floyd.md`.
- **DNS** — `landonfoister.com` and `blog.landonfoister.com` need to be pointed at the Cloudflare Tunnel once the VM is provisioned.
- **CI/CD** — a GitHub Actions workflow that SSHes into the Proxmox VM, `git pull`s, and runs `docker compose up -d --build` on push to `main` is TBD.
- **Coordinate sandbox terminal output styling** — if Caddy's `try_files` ever 404s on `/projects/`, double-check the trailing-slash behavior; the directory-style path with `try_files {path}/ {path}.html` is intentional.

## When picking up later

1. Decide when to provision the Proxmox VM (Ubuntu Server 24.04 LTS is a fine default).
2. Install Docker + Docker Compose plugin on the VM. `git clone` this repo. Run `docker compose up -d --build`.
3. The `cloudflared` sidecar in compose handles the tunnel; in the Cloudflare Zero Trust dashboard, route `landonfoister.com` + `blog.landonfoister.com` to `http://web:80` (host header preserved).
4. Configure Cloudflare DNS records to point at the tunnel.
5. Decide on auto-deploy: GitHub Actions over SSH, or `cloudflared`-tunnel-fronted webhook, or just `git pull && docker compose up -d --build` manually.
6. Add a systemd unit (or `restart: unless-stopped` is already set in compose) so the stack survives VM reboots.
