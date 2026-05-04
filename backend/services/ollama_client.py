import json
import os
import re
from typing import AsyncGenerator

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1")


async def call_ollama(prompt: str, model: str | None = None) -> str:
    effective_model = model or OLLAMA_MODEL
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": effective_model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama is not running. Start it with: ollama serve (model: {effective_model})",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Ollama timed out — model may still be loading")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama error: {e}")


async def stream_ollama(
    prompt: str,
    model: str | None = None,
    messages: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    Async generator that streams tokens from Ollama's /api/chat endpoint.

    *messages* should be a list of {"role": "user"|"assistant", "content": "..."} dicts.
    *prompt* is used as a fallback user message if messages is empty/None.
    """
    effective_model = model or OLLAMA_MODEL
    chat_messages = messages if messages else [{"role": "user", "content": prompt}]

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": effective_model,
                    "messages": chat_messages,
                    "stream": True,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield token
                    if chunk.get("done"):
                        break
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="AI model unavailable — is Ollama running?",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Ollama timed out — model may still be loading")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama streaming error: {e}")


def extract_json(text: str) -> dict:
    # Strip <think>...</think> blocks that deepseek-r1 emits
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # Try to find a JSON block in the response
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group(1))

    # Fallback: find the outermost { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start:end + 1])

    raise ValueError(f"No JSON found in model response: {text[:300]}")
