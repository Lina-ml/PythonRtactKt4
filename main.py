import asyncio
import json
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse

app = FastAPI(title="Currency Monitor")

async def get_currency_rates():
    url = (
        "https://api.frankfurter.dev/v1/latest"
        "?base=EUR&symbols=USD,GBP,CHF,ILS,CAD"
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()
        return {
            "base": data["base"],
            "rates": data["rates"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

# SSE endpoint
@app.get("/events")
async def currency_events(request: Request):
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                rates = await get_currency_rates()

                yield {
                    "event": "currency_update",
                    "data": json.dumps(rates)
                }

            except Exception as error:
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "message": str(error)
                    })
                }

            await asyncio.sleep(10)
    return EventSourceResponse(event_generator())
