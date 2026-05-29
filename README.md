# Landon Foister Personal Website

Cyber-brutalist/Y3K static portfolio site at `landonfoister.com`, plus a Docusaurus blog at `blog.landonfoister.com`. Both are served by a single Caddy container behind Docker Compose.

## Running locally

Requires Docker and the Docker Compose plugin.

```bash
docker compose up --build
```

Then open:

- http://landonfoister.localhost/ — static portfolio
- http://blog.landonfoister.localhost/ — Docusaurus blog

The `.localhost` TLD resolves to `127.0.0.1` automatically on macOS, Linux, and modern Windows — no `/etc/hosts` edits needed.

Static files (`index.html`, `projects/`, `certifications/`, `resume/`, `visual-board/`, `blog/`, `assets/`) are bind-mounted, so edits show up on browser reload. The blog is baked into the image; after editing `blog-site/`, rebuild with `docker compose up --build`.

## Pages

- `/` — portfolio homepage
- `/projects/` — Coordinate + Home Lab case studies (includes the Coordinate sandbox terminal)
- `/certifications/` — certification summary
- `/resume/` — meta-refresh to the public resume PDF
- `/blog/` — meta-refresh to `blog.landonfoister.com`
- `/visual-board/` — original design-board artifact

## Repository layout

See [`CLAUDE.md`](./CLAUDE.md) for the full layout, design tokens, and working rules.
