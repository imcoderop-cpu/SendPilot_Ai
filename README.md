# SpendPilot AI

SpendPilot AI is a finance-operations dashboard prepared for the **PayPal AI Hackathon 2026**. It helps a team explore SaaS spend, renewal risk, unused seats, and possible savings through a dataset-backed dashboard and AI-assisted analysis.

The app is designed as a polished, interactive hackathon demo. It uses synthetic company, subscription, and PayPal sandbox-ledger data; it does **not** connect to or change a real PayPal account, send vendor emails, or modify subscriptions.

## What it does

- Summarizes annual and monthly SaaS spend, estimated savings, business health, and renewal risk.
- Searches, filters, and sorts the subscription snapshot.
- Highlights low-utilization and inactive seats with Subscription Doctor findings.
- Shows department-level spend and savings estimates in Analytics.
- Runs what-if savings scenarios locally in the browser.
- Creates vendor negotiation drafts for review and can request AI-assisted recommendations.
- Displays synthetic PayPal ledger transactions, invoices, and payment details.
- Produces executive report previews and print-ready reports that can be saved as PDF from the browser's print dialog.
- Guides judges through the main flows with the interactive demo.

Savings, health scores, and AI recommendations are estimates based on the included demo data. Review them before making business decisions.

## Run locally

**Requirements:** Python 3.11 or newer and an OpenRouter API key for live AI features. The dashboard and non-AI demo flows work from the included JSON datasets without an AI key.

From the project root in PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and set `OPENROUTER_API_KEY` to your own key. Do not paste API keys into frontend files, JSON datasets, screenshots, or commits. The default model is configurable with `OPENROUTER_MODEL`; provider model availability and free-tier limits can change.

Start the app from the project root:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000/** or **http://127.0.0.1:8000/dashboard.html**. The project also supports VS Code Live Server on localhost ports 5500–5502: AI requests automatically go to the FastAPI server on port 8000, with local CORS enabled. For another frontend origin, set `SPENDPILOT_CORS_ORIGINS` to a comma-separated allowlist and configure `window.SPENDPILOT_API_BASE_URL` before loading `js/api.js`.

FastAPI's interactive API documentation is at **http://127.0.0.1:8000/docs**; the health endpoint is **http://127.0.0.1:8000/api/health**.

## Deploy the full app on Render

The repository includes a Render Blueprint that deploys the FastAPI backend and frontend together as one web service, so dashboard pages and `/api` requests share the same origin. Use the [Render deploy link](https://render.com/deploy?repo=https://github.com/imcoderop-cpu/SendPilot_Ai), sign in to Render, and review the service before creating it. The initial free service may spin down after inactivity and take a little time to wake up.

Render will ask you to set `OPENROUTER_API_KEY` as a private service environment variable. Enter your own key in Render's dashboard; it is deliberately not stored in GitHub or the deployment blueprint. Until you add a key, the dashboard and PayPal sample ledger still load, while AI endpoints return a setup message. You can add or change it under the service's **Environment** settings. The public app URL and API docs are shown in the Render dashboard after the deployment succeeds.

## AI provider and API

The backend sends AI requests to OpenRouter; the browser never calls the provider directly and never receives the API key. Configure `OPENROUTER_API_KEY` in the process environment or a root `.env` file. AI endpoints return a consistent JSON envelope:

```json
{
  "success": true,
  "message": "Analysis text",
  "data": {}
}
```

Endpoints: `/api/chat`, `/api/ai-cfo`, `/api/subscription-doctor`, `/api/executive-summary`, `/api/business-impact`, `/api/ai-negotiator`, `/api/recommendations`, and `/api/financial-insights`. Validation, provider errors, and timeouts return actionable errors in the same envelope.

## Data and integrations

The app reads its demo datasets from `frontend/data/`. The matching top-level `data/` directory is retained as a copy for project workflows. PayPal ledger rows are synthetic sandbox examples, not retrieved from a live PayPal API. Banking, Slack, Gmail, and subscription-management actions are not connected; the interface labels demo-only actions and does not claim that external changes were made.

## Tests

Run backend tests from the project root:

```powershell
python -m unittest discover -s tests
```

## Project layout

```text
backend/       FastAPI app, AI routes, prompts, and OpenRouter client
frontend/      Multipage dashboard, JavaScript, assets, and served JSON datasets
data/          Copy of the demo JSON datasets
tests/         Backend API and validation tests
requirements.txt
```

## GitHub and secret safety

`.env` files, Python bytecode, and virtual environments are ignored by Git. Keep real credentials only in an ignored environment file or a secret manager, and rotate any credential that has been shared in chat or committed accidentally. `.env.example` contains variable names only.
