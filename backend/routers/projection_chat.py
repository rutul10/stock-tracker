"""
POST /projection/chat — Streaming SSE endpoint for conversational trade analysis.
"""
import asyncio
from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from services.ollama_client import stream_ollama
from services.prompt_builder import build_chat_system_prompt

router = APIRouter()

MAX_TURNS = 10


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ProjectionChatRequest(BaseModel):
    symbol: str
    context: Optional[dict] = None        # indicators snapshot, projection result
    user_profile: Optional[dict] = None   # risk_tolerance, preferred_dte, max_position_size
    messages: list[ChatMessage]

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        v = v.strip().upper()
        if not v or not v.isalpha() or len(v) > 10:
            raise ValueError("symbol must be 1-10 alphabetic characters")
        return v


async def _sse_generator(messages: list[dict], model: str | None = None):
    """Yield SSE-formatted tokens from Ollama, ending with [DONE]."""
    try:
        async for token in stream_ollama(prompt="", model=model, messages=messages):
            # Escape newlines inside SSE data field
            escaped = token.replace("\n", "\\n")
            yield f"data: {escaped}\n\n"
            # Small yield to allow the event loop to flush
            await asyncio.sleep(0)
    except Exception as e:
        yield f"data: [ERROR] {e}\n\n"
    finally:
        yield "data: [DONE]\n\n"


@router.post("/projection/chat")
async def projection_chat(req: ProjectionChatRequest):
    """
    Streaming chat endpoint for conversational AI trade analysis.
    Returns text/event-stream SSE where each event is a token chunk.
    Conversation is capped at the last 10 turns.
    """
    symbol = req.symbol.upper()

    # Build system prompt
    system_prompt = build_chat_system_prompt(
        symbol=symbol,
        context=req.context,
        user_profile=req.user_profile,
    )

    # Enforce 10-turn cap (each turn = one user + one assistant message)
    capped_messages = list(req.messages)[-MAX_TURNS:]

    # Assemble the full messages list: system first, then conversation history
    ollama_messages: list[dict] = [
        {"role": "system", "content": system_prompt},
        *[{"role": m.role, "content": m.content} for m in capped_messages],
    ]

    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(
        _sse_generator(ollama_messages),
        media_type="text/event-stream",
        headers=headers,
    )
