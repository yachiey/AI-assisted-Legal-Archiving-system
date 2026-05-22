# Frontend (`resources/js`) layout

React + TypeScript, rendered through Inertia, built by Vite.

## Tree

```
resources/js/
├── app.tsx            # Inertia entry — resolves Pages/** by name
├── bootstrap.js
├── Pages/             # Inertia pages (one per route), grouped by role
│   ├── Admin/         # Account, ActivityLogs, Aiassistant, Dashboard, Document
│   ├── Staff/         # Dashboard, AIAssistant, Documents
│   └── Home/          # public landing
├── Components/        # shared components (About, Common, Contact, Footer,
│                      #   GlobalChat, HeroSection, Modal, News, Public Navbar, Templates)
├── Context/           # ChatContext.tsx, DashboardContext.tsx
├── hooks/             # useDashboardTheme.ts, usePermissionPolling.ts
└── Types/             # shared TS types
```

Inertia resolves a page by its name (e.g. `Admin/Document`) to the matching file under
`Pages/` via `app.tsx`. A controller returning `Inertia::render('Admin/Document', ...)`
maps to `resources/js/Pages/Admin/Document/...`.

## Admin / Staff mirroring (important)

Most features exist in BOTH `Pages/Admin/` and `Pages/Staff/`. **When you change one, update the other.** Watch the casing/naming differences:

| Admin | Staff |
|-------|-------|
| `Admin/Aiassistant` | `Staff/AIAssistant` |
| `Admin/Document` | `Staff/Documents` |
| `Admin/Dashboard` | `Staff/Dashboard` |

## Feature page anatomy

A feature folder (e.g. `Pages/Admin/Aiassistant/`) is laid out as:

```
<Feature>/
├── index.tsx          # page root
├── components/        # feature-scoped components, often sub-grouped:
│   ├── chat/          #   ChatInput, ChatInterface, ChatMessage, FileLink
│   ├── document/      #   DocumentList, DocumentSelectionModal, DocumentUpload, FolderDocumentGroup
│   ├── layout/        #   Header, SidebarUi/ (Sidebar, ChatSessionItem, FolderGroup, …, index.ts)
│   └── ui/            #   Button, Input, Modal
├── hooks/             # feature hooks (e.g. useApi.ts)
├── services/          # api.ts — typed client hitting routes/api.php
└── types/             # index.ts — feature TS types
```

## Conventions

- **`isTransitioning`** state guards prevent content flash during folder navigation — preserve them.
- Styling uses Tailwind + daisyUI.
- Feature-local components/hooks/types stay inside the feature folder; only promote to
  `resources/js/Components|hooks|Types` when shared across features.
