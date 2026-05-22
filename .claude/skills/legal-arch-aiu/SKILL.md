---
name: legal-arch-aiu
description: Project guide for the Legal Arch AIU codebase (Laravel + Inertia + React/TS with Python AI microservices). Use when adding files, choosing where code belongs, understanding the architecture, or building/running the app in this repo.
---

# Legal Arch AIU — Project Guide

A legal document management system with AI-assisted classification, search, and chat.

## Stack

- **Backend** — Laravel (PHP), Eloquent ORM, queued jobs.
- **Bridge** — Inertia.js connects Laravel controllers to React pages (no separate REST layer for page rendering).
- **Frontend** — React + TypeScript, built with Vite, styled with Tailwind + daisyUI.
- **AI services** — Python (Flask) microservices in `aiservice/` (embeddings, text extraction, AI bridge, local Llama chatbot). Uses Groq API with a local Llama fallback.
- **Scanner bridge** — a Node service in `scanner_service/` for document scanning.

## Top-level map

| Path | Holds |
|------|-------|
| `app/` | Laravel backend — Controllers, Services, Models, Jobs, Exports, Mail, Providers |
| `resources/js/` | React/TS frontend (Inertia pages, shared components, hooks, context) |
| `routes/` | `web.php` (Inertia/web), `api.php` (JSON API), `console.php` (artisan commands) |
| `database/` | Migrations, factories, seeders |
| `config/` | Laravel config |
| `aiservice/` | Python Flask AI microservices |
| `scanner_service/` | Node scanner bridge |
| `share_app.bat` | One-shot launcher: builds frontend + starts all services + queue + web server |

## Where new code goes

| You're adding… | Put it in… |
|----------------|-----------|
| HTTP endpoint / page logic | `app/Http/Controllers/<Name>Controller.php` |
| Business / domain logic | `app/Services/<Name>Service.php` (e.g. `DocumentQueryService`, `FolderMatchingService`, `GroqService`) |
| Eloquent model | `app/Models/` |
| Excel / PDF export | `app/Exports/` |
| Background / queued work | `app/Jobs/` |
| JSON API route | `routes/api.php` |
| Web / Inertia route | `routes/web.php` |
| React feature page | `resources/js/Pages/{Admin\|Staff}/<Feature>/index.tsx` + `components/`, `hooks/`, `services/`, `types/` |
| Reusable React UI / state | `resources/js/Components/`, `Context/`, `hooks/`, `Types/` |

For deeper detail see:
- [references/backend.md](references/backend.md) — Laravel layout, the actual controllers/services/models.
- [references/frontend.md](references/frontend.md) — `resources/js` tree, Admin/Staff mirroring, page anatomy.
- [references/ai-services.md](references/ai-services.md) — Python services, ports, launch order.

## Key conventions

- **Admin/Staff mirroring** — most features exist in BOTH `Pages/Admin/` and `Pages/Staff/`. When you change one, check and update the other. Mind the casing differences: `Admin/Aiassistant` vs `Staff/AIAssistant`, `Admin/Document` vs `Staff/Documents`.
- **Feature page anatomy** — a feature folder is `index.tsx` + `components/{chat,document,layout,ui}/` + `hooks/` + `services/api.ts` + `types/index.ts`.
- **`isTransitioning` guards** — used to prevent content flash during folder navigation; preserve them when editing navigation logic.
- **AI title format** — `YYYY-MM-DD-FullName-DocumentType` (PascalCase, no spaces).
- **`detectFolder()` guard** — has a `strlen < 3` check in `AIAssistantController` to prevent false folder matches; keep it.

## Build & run

- **Frontend changes require a build** — Vite-built assets serve in production. After editing `resources/js`, run `npm run build` (or `npm run dev` for the Vite dev server during development).
- **Full app launch** — `share_app.bat` (Windows): builds the frontend, then starts all 6 services, the queue worker, and `php artisan serve --host 0.0.0.0 --port 8000`. It also prints the LAN IP so other staff on the network can connect.
- The Python AI services and the Node scanner bridge must be running for AI features and scanning to work — see [references/ai-services.md](references/ai-services.md) for the per-service ports.
