# Backend (Laravel) layout

All backend code lives under `app/`. Routes are in `routes/`, migrations in `database/`.

## `app/` subdirectories

| Dir | Purpose |
|-----|---------|
| `Http/Controllers/` | Request handling; render Inertia pages or return JSON |
| `Services/` | Business / domain logic, kept out of controllers |
| `Models/` | Eloquent models |
| `Jobs/` | Queued background work (run by `php artisan queue:work`) |
| `Exports/` | Excel / PDF export classes |
| `Mail/` | Mailables |
| `Providers/` | Service providers |
| `Console/` | Artisan commands |

## Controllers (`app/Http/Controllers/`)

`AIAssistantController`, `AIProcessController`, `AccountController`, `AdminController`,
`CategoryController`, `ContactController`, `DocumentController`, `FileUploadController`,
`FolderController`, `HomeController`, `ManualProcessController`, `ReportController`,
`StaffController`, `UploadController`, `UserProfileController`, plus `Auth/` (auth scaffolding)
and the base `Controller.php`.

- `AIAssistantController` — AI chat controller. Contains `detectFolder()` with the
  `strlen < 3` false-match guard.

## Services (`app/Services/`)

| Service | Role |
|---------|------|
| `DocumentQueryService` | Document search, including semantic search |
| `FolderMatchingService` | Matches documents to folders |
| `DocumentProcessingService` | Processing pipeline for documents |
| `DocumentStorageService` | Storage handling |
| `AIAnalysisService` | AI analysis orchestration |
| `GroqService` | Groq API client |
| `ActivityLogger` | Activity-log writes |

## Models (`app/Models/`)

`User`, `Document`, `DocumentEmbedding`, `Folder`, `AIConversation`, `AIFolder`,
`AIHistory`, `ActivityLog`, `Notification`, `PermissionRequest`.

- `DocumentEmbedding` backs semantic search (vector embeddings produced by the embedding service).
- `AIFolder` / `AIConversation` back the AI assistant chat sessions and their folder grouping.

## Routes (`routes/`)

- `web.php` — web + Inertia page routes.
- `api.php` — JSON API routes (consumed by the React `services/api.ts` clients).
- `console.php` — closures/commands for artisan.
