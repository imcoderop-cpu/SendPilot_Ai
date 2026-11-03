"""Validated AI endpoints with a consistent JSON response envelope."""

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from backend.services.openrouter_service import (
    OpenRouterUnavailableError,
    generate_feature_response,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["AI"])

REQUEST_TIMEOUT_SECONDS = 24
MAX_CONTEXT_BYTES = 24_000


class AIResponse(BaseModel):
    success: bool
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class ContextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    context: dict[str, Any]
    question: str | None = Field(default=None, max_length=2_000)

    @field_validator("question")
    @classmethod
    def validate_question(cls, question: str | None) -> str | None:
        if question is None:
            return None
        question = question.strip()
        if not question:
            raise ValueError("Question cannot be blank.")
        return question

    @field_validator("context")
    @classmethod
    def validate_context(cls, context: dict[str, Any]) -> dict[str, Any]:
        try:
            encoded = json.dumps(context, ensure_ascii=False).encode("utf-8")
        except (TypeError, ValueError) as error:
            raise ValueError("Context must contain JSON-compatible data.") from error
        if len(encoded) > MAX_CONTEXT_BYTES:
            raise ValueError("Context must be no larger than 24 KB.")
        return context


class ChatRequest(ContextRequest):
    message: str = Field(min_length=1, max_length=2_000)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=10)

    @field_validator("message")
    @classmethod
    def validate_message(cls, message: str) -> str:
        message = message.strip()
        if not message:
            raise ValueError("Message cannot be blank.")
        return message

    @field_validator("history")
    @classmethod
    def validate_history(
        cls, history: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        allowed_roles = {"user", "assistant"}
        for item in history:
            if set(item) != {"role", "content"} or item["role"] not in allowed_roles:
                raise ValueError("History entries require a user or assistant role and content.")
            if not item["content"] or len(item["content"]) > 2_000:
                raise ValueError("History content must contain 1 to 2,000 characters.")
        return history

    @model_validator(mode="after")
    def validate_total_size(self) -> "ChatRequest":
        history_size = sum(len(item["content"]) for item in self.history)
        if history_size > 8_000:
            raise ValueError("Conversation history is too large.")
        return self


async def _run_feature(
    feature: str,
    *,
    context: dict[str, Any],
    message: str | None = None,
    history: list[dict[str, str]] | None = None,
) -> AIResponse | JSONResponse:
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                generate_feature_response,
                feature,
                message=message,
                context=context,
                history=history,
            ),
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        return AIResponse(success=True, **result)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "message": "The AI request took too long. Please try again.",
                "data": {},
            },
        )
    except OpenRouterUnavailableError as error:
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": str(error), "data": {}},
        )
    except Exception as error:
        logger.error(
            "Unexpected AI endpoint failure for %s (%s)",
            feature,
            type(error).__name__,
        )
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "The AI service is temporarily unavailable. Please try again.",
                "data": {},
            },
        )


@router.post("/chat", response_model=AIResponse)
async def chat(body: ChatRequest) -> AIResponse:
    return await _run_feature(
        "chat",
        message=body.message,
        context=body.context,
        history=body.history,
    )


@router.post("/ai-cfo", response_model=AIResponse)
async def ai_cfo(body: ContextRequest) -> AIResponse:
    return await _run_feature("ai-cfo", context=body.context)


@router.post("/subscription-doctor", response_model=AIResponse)
async def subscription_doctor(body: ContextRequest) -> AIResponse:
    return await _run_feature("subscription-doctor", context=body.context)


@router.post("/executive-summary", response_model=AIResponse)
async def executive_summary(body: ContextRequest) -> AIResponse:
    return await _run_feature("executive-summary", context=body.context)


@router.post("/business-impact", response_model=AIResponse)
async def business_impact(body: ContextRequest) -> AIResponse:
    return await _run_feature(
        "business-impact",
        message=body.question,
        context=body.context,
    )


@router.post("/ai-negotiator", response_model=AIResponse)
async def ai_negotiator(body: ContextRequest) -> AIResponse:
    return await _run_feature("ai-negotiator", context=body.context)


@router.post("/recommendations", response_model=AIResponse)
async def recommendations(body: ContextRequest) -> AIResponse:
    return await _run_feature(
        "recommendations",
        message=body.question,
        context=body.context,
    )


@router.post("/financial-insights", response_model=AIResponse)
async def financial_insights(body: ContextRequest) -> AIResponse:
    return await _run_feature(
        "financial-insights",
        message=body.question,
        context=body.context,
    )


@router.get("/health", response_model=AIResponse)
async def health() -> AIResponse:
    return AIResponse(success=True, message="SpendPilot AI backend is ready.")
