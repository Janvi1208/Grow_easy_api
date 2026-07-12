# GrowEasy — AI-Powered CSV Lead Importer

Upload a CSV export from anywhere — Facebook Lead Ads, Google Ads, Excel, another
CRM, or a hand-built spreadsheet — and AI maps its columns into GrowEasy's CRM
lead format, no matter how the source file is structured.

```
groweasy-csv-importer/
├── backend/      Node.js + Express API (CSV parsing + AI extraction)
├── frontend/     Next.js app (upload → preview → confirm → results)
└── docker-compose.yml
```

## How it works

1. **Upload** — drag & drop or pick a `.csv` file. Nothing is sent to the server yet.
2. **Preview** — the file is parsed in the browser and shown in a scrollable,
   sticky-header table exactly as it was exported. Still no AI call.
3. **Confirm** — clicking "Confirm & import with AI" is the only action that
   calls the backend.
4. **Results** — the backend batches the rows, sends each batch to an LLM with
   a schema-mapping prompt, validates the AI's output against GrowEasy's rules,
   and returns imported vs. skipped records with totals.

## Prerequisites

- Node.js 18+
- An API key for one LLM provider: Anthropic, OpenAI, or Gemini

## 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env and set AI_PROVIDER + the matching API key
npm install
npm run dev        # starts onhttps://grow-easy-api.onrender.com
```

`.env` options:

| Variable            | Description                                      |
|---------------------|---------------------------------------------------|
| `AI_PROVIDER`       | `anthropic` \| `openai` \| `groq` \| `gemini`     |
| `ANTHROPIC_API_KEY` | required if `AI_PROVIDER=anthropic`               |
| `OPENAI_API_KEY`    | required if `AI_PROVIDER=openai`                  |
| `GROQ_API_KEY`      | required if `AI_PROVIDER=groq` (free tier available at console.groq.com) |
| `GEMINI_API_KEY`    | required if `AI_PROVIDER=gemini`                  |
| `AI_BATCH_SIZE`     | rows sent per AI request (default `25`)           |
| `AI_MAX_RETRIES`    | retries per failed batch (default `2`)            |
| `FRONTEND_ORIGIN`   | CORS origin, e.g. `http://localhost:3000`         |

Groq and OpenAI are called through the same OpenAI-compatible chat completions
endpoint, so adding another OpenAI-compatible provider later is a one-function
change in `aiExtractor.service.js`.

## 2. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local if the backend isn't on localhost:8080
npm install
npm run dev         # starts on http://localhost:3000
```

Open `http://localhost:3000`, upload the sample file at
`frontend/public/sample-lead-export.csv` (or any real export) to try it end to end.

## 3. Docker (optional, runs both services)

```bash
cp backend/.env.example backend/.env   # fill in your API key first
docker compose up --build
```

## API

### `POST /api/csv/import`

`multipart/form-data` with a `file` field containing the `.csv`.

```json
{
  "summary": {
    "total_rows": 42,
    "total_imported": 39,
    "total_skipped": 3,
    "total_batches": 2,
    "detected_columns": ["Lead Date", "Full Name", "..."]
  },
  "records": [ { "created_at": "...", "name": "...", "...": "..." } ],
  "skipped_records": [ { "reason": "Missing both email and mobile number", "source_row": { } } ],
  "parse_warnings": []
}
```

### `GET /api/health`

Simple health check that also reports which AI provider is active.

## Design decisions

- **AI mapping, not hardcoded headers.** The backend never assumes column
  names — the CSV is parsed generically and the raw rows (whatever their
  headers) are handed to the LLM with a prompt that encodes every GrowEasy
  business rule (allowed `crm_status`/`data_source` enums, date format,
  multi-email/phone handling, single-line CSV safety).
- **Deterministic validation after the AI call.** The AI's JSON output is
  re-validated server-side (`services/validator.service.js`) so enum values,
  date parseability, and the "skip if no email/mobile" rule are guaranteed
  even if the model drifts.
- **Batching with per-batch retries.** Rows are chunked (`AI_BATCH_SIZE`) and
  each batch retries independently (`AI_MAX_RETRIES`) so one bad batch can't
  fail an entire import — it's reported as skipped with a clear reason instead.
- **Provider-agnostic AI layer.** `aiExtractor.service.js` supports Anthropic,
  OpenAI, or Gemini behind one interface, switchable via `AI_PROVIDER`.
- **Frontend never calls AI directly.** Preview parsing happens fully
  client-side with PapaParse; the backend is only touched after the user
  explicitly confirms, per the assignment's Step 3 requirement.

## Bonus features implemented

- Drag & drop upload with file-type/size validation
- Loading state while the AI batches run
- Sticky-header, horizontally + vertically scrollable tables for both preview
  and results
- Imported vs. skipped tabs with per-row skip reasons
- Retry mechanism for failed AI batches
- Dockerfiles for both services + a root `docker-compose.yml`
- Sample CSV (`frontend/public/sample-lead-export.csv`) with messy headers,
  multiple emails/phones, and a row that should be skipped, for quick testing

## Deploying

- **Backend** → Railway / Render: point it at `backend/`, set the env vars
  from `.env.example`, expose port `8080`.
- **Frontend** → Vercel: point it at `frontend/`, set
  `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.
