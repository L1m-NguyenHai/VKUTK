"""
N8N Chatbot Cog

Provides a simple endpoint that forwards messages to the external n8n webhook
located at `https://n8n.group12.cloud/webhook/chat-bot`.

Endpoints:
- POST `/send`: Accepts `message` and `auth_userid`, forwards to n8n webhook and
  returns the response.
- GET `/info`: Returns basic cog info and last responses.

This cog follows the project's `BaseCog` pattern and exposes routes under
`/api/plugins/n8n_chatbot` once registered.

Response Format Supported:
- **bold text** for bold
- [link text](url) for clickable links
- \n for line breaks (converted to newline characters)
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from fastapi import FastAPI, Request, HTTPException
from .base_cog import BaseCog, CogMetadata
from datetime import datetime
import httpx


WEBHOOK_URL = "https://n8n.group12.cloud/webhook/chat-documents"


class ChatSendRequest(BaseModel):
    message: str
    auth_userid: Optional[str] = None


class N8NChatbotCog(BaseCog):
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="N8N Chatbot",
            description="Forward messages to n8n chatbot webhook",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="MessageSquare",
            color="from-blue-500 to-indigo-600"
        )
        self.last_responses: List[Dict[str, Any]] = []

    def setup(self):
        @self.router.get("/")
        async def info():
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "webhook_url": WEBHOOK_URL,
                "last_responses": self.last_responses[-10:],
            }

        @self.router.post("/send")
        async def send_chat(req: ChatSendRequest):
            """
            Forward `message` and `auth_userid` to the external n8n webhook.

            Request JSON body (example):
            {
              "message": "Hello, bot!",
              "auth_userid": "user123"
            }

            Returns the JSON response from the external webhook (if any).
            Handles array responses like [{"output": "..."}]
            """
            payload = {
                "message": req.message,
                "auth_userid": req.auth_userid,
                "sent_at": datetime.utcnow().isoformat() + "Z",
            }

            async with httpx.AsyncClient(timeout=180.0) as client:
                try:
                    resp = await client.post(WEBHOOK_URL, json=payload)
                except httpx.RequestError as exc:
                    raise HTTPException(status_code=502, detail=f"Request to webhook failed: {exc}")

            # Try to parse JSON response, otherwise return text
            content: Any
            message_text: str = "No response received"
            
            try:
                content = resp.json()
                
                # Handle array response like [{"output": "Chào bạn!"}]
                if isinstance(content, list) and len(content) > 0:
                    first_item = content[0]
                    if isinstance(first_item, dict):
                        # Try common field names: output, message, text, response
                        for field in ["output", "message", "text", "response"]:
                            if field in first_item:
                                message_text = first_item[field]
                                break
                        else:
                            # If no recognized field, stringify the whole object
                            message_text = str(first_item)
                    else:
                        message_text = str(first_item)
                # Handle object response like {"output": "Chào bạn!"}
                elif isinstance(content, dict):
                    for field in ["output", "message", "text", "response"]:
                        if field in content:
                            message_text = content[field]
                            break
                    else:
                        # If no recognized field, return whole object as string
                        message_text = str(content)
                else:
                    message_text = str(content)
                    
            except Exception:
                content = resp.text
                message_text = resp.text

            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request": payload,
                "status_code": resp.status_code,
                "response": content,
            }
            self.last_responses.append(log_entry)
            if len(self.last_responses) > 100:
                self.last_responses = self.last_responses[-100:]

            return {
                "success": resp.status_code >= 200 and resp.status_code < 300,
                "status_code": resp.status_code,
                "message": message_text,
                "response": content,
            }

        @self.router.get("/logs")
        async def get_logs(limit: int = 20):
            return {"total": len(self.last_responses), "logs": self.last_responses[-limit:]}

    def cleanup(self):
        self.last_responses.clear()


def setup(app: FastAPI):
    cog = N8NChatbotCog(app)
    cog.setup()
    cog.register_routes()
    return cog
