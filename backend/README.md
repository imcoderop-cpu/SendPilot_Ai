# SpendPilot AI backend

The FastAPI app serves the existing frontend and its AI endpoints from one origin.
Set `OPENROUTER_API_KEY` in the process environment or in a root `.env` file.
The backend also checks `frontend/.env` when it is a regular file, plus
environment files stored as `frontend/.env/.env` or `frontend/.env/Untitled`.
Never add keys to frontend JavaScript or JSON data. `OPENROUTER_MODEL` is
optional and defaults to `nvidia/nemotron-3.5-super-vl:free`, currently listed
with a 1,000,000-token context window and no listed expiration date. Free model
access, limits, and availability are controlled by OpenRouter and may change.

The requirements use plain Uvicorn rather than its optional `standard` extra,
so installing the backend does not require PyYAML or native C++ build tools.

Install dependencies from the project root and start the app:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

For a hosted deployment, the repository's root `render.yaml` defines a single
Render web service for both the FastAPI backend and frontend. Set
`OPENROUTER_API_KEY` in the hosting provider's private environment settings;
never put a live key in the blueprint or source control.

Open `http://127.0.0.1:8000/dashboard.html` so the frontend and `/api` requests
use the FastAPI server on the same origin. If the frontend is hosted separately,
set `window.SPENDPILOT_API_BASE_URL` to the backend's `/api/` URL before loading
`js/api.js` and configure the backend to allow that origin. AI endpoints return
`{ "success": true, "message": "...", "data": {} }` (or the same envelope with
`success: false` on an error).
