# AI & scanner services

The AI features and scanning depend on standalone services launched by `share_app.bat`.
Each runs in its own window. The Laravel app talks to them over HTTP on localhost.

## Services and ports

| Service | Port | Launcher | Notes |
|---------|------|----------|-------|
| Embedding Service | 5001 | `python aiservice/run_embedding_service.py` | Generates vector embeddings (backs semantic search / `DocumentEmbedding`) |
| Text Extraction Service | 5002 | `python aiservice/run_text_extraction.py` | OCR / text extraction from documents |
| Scanner Bridge (Node) | 3000 | `cd scanner_service && node server.js` | Hardware document scanning |
| AI Bridge | 5003 | `python aiservice/run_ai_bridge.py` | Core: title / description / remarks generation |
| Chatbot (local Llama) | 5000 | `python aiservice/run_chatbot.py` | Conversational chatbot |

`share_app.bat` starts them in the order above, then the queue worker and
`php artisan serve --host 0.0.0.0 --port 8000`.

## `aiservice/` layout

```
aiservice/
├── ai_bridge/              # core AI service
│   ├── ai_bridge_app.py    # Flask app
│   ├── ai_service.py       # title/description/remarks generation (core logic)
│   ├── routes.py
│   ├── model_loader.py
│   └── config.py
├── chatbot/                # local Llama chatbot
│   ├── chatbot_service.py
│   ├── llama_generator.py
│   ├── model_manager.py
│   ├── conversation.py
│   ├── routes.py
│   └── config.py
├── embedding_service/      # embedding_service.py
├── text_extraction/        # text_extraction_service.py (+ requirements_ocr.txt)
├── run_*.py                # per-service entry points
├── run_all_services.py     # run everything from one process
├── windows_fix.py          # Windows error-6 stdout/stderr handle fix
└── requirements.txt
```

## AI conventions & gotchas

- **Model strategy** — Groq API is the primary LLM; a **local Llama** model is the fallback.
- **AI title format** — generated titles follow `YYYY-MM-DD-FullName-DocumentType`
  (PascalCase, no spaces). Core generation lives in `ai_bridge/ai_service.py`.
- **Windows error 6** — test stdout/stderr handles before Flask starts (handled by
  `windows_fix.py`); needed because services launch in detached `cmd /k` windows.
- **`detectFolder()`** on the Laravel side (`AIAssistantController`) keeps a `strlen < 3`
  guard so short strings don't produce false folder matches.
