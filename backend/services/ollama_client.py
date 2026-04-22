import json
import os
import re

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1")


async def call_ollama(prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama is not running. Start it with: ollama serve (model: {OLLAMA_MODEL})",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Ollama timed out — model may still be loading")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama error: {e}")


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
