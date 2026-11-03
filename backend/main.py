"""FastAPI application and same-origin frontend hosting."""

import logging
import os
from pathlib import Path
from pathlib import PurePosixPath

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
from starlette.types import Scope

from backend.routes.ai import router as ai_router

ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SpendPilot AI API", version="1.0.0")
local_frontend_origins = [
    f"http://{host}:{port}"
    for host in ("localhost", "127.0.0.1")
    for port in (5500, 5501, 5502)
]
configured_origins = [
    origin.strip()
    for origin in os.getenv("SPENDPILOT_CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[*local_frontend_origins, *configured_origins],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.include_router(ai_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, error: RequestValidationError
) -> JSONResponse:
    del request
    messages = [
        item["msg"].removeprefix("Value error, ")
        for item in error.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": messages[0] if messages else "Invalid request. Check the submitted data.",
            "data": {},
        },
    )


if FRONTEND_DIR.is_dir():
    class FrontendFiles(StaticFiles):
        async def get_response(self, path: str, scope: Scope) -> Response:
            if any(part.startswith(".") for part in PurePosixPath(path).parts):
                raise HTTPException(status_code=404)
            return await super().get_response(path, scope)

    app.mount("/", FrontendFiles(directory=FRONTEND_DIR, html=True), name="frontend")
