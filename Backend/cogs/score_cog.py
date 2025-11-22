"""
Score Cog - Send score queries to n8n for score processing

This cog provides the /scores command to send queries to n8n webhook.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class ScoreRequest(BaseModel):
    message: str
    auth_userid: str


class ScoreResponse(BaseModel):
    success: bool
    message: str
    webhook_response: Optional[dict] = None


class ScoreCog(BaseCog):
    """
    Score Integration Plugin
    
    Provides /scores command to send queries to n8n for score processing
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Scores",
            description="Send queries to n8n for score processing",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Award",
            color="from-yellow-500 to-amber-500",
            commands=[
                CommandDefinition(
                    command="scores",
                    description="Query your scores and grades",
                    fields=[
                        CommandField(
                            name="message",
                            label="Your Query",
                            type="textarea",
                            placeholder="Ask about your scores, GPA, grades...",
                            required=True
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook/chat-score"
        self.command_history = []
        
    def setup(self):
        """Setup Scores webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Scores cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "usage": {
                    "command": "/scores",
                    "example": {
                        "message": "What are my current scores?",
                        "auth_userid": "student123"
                    }
                },
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/execute", response_model=ScoreResponse)
        async def execute_command(data: ScoreRequest):
            """
            Execute /scores command - Send query to n8n webhook
            
            Request body:
            - message: The query/message to send
            - auth_userid: User identifier from authentication
            
            Returns:
            - success: Whether webhook was sent successfully
            - message: Status message
            - webhook_response: Response from n8n webhook
            """
            print(f"[Scores] Received execute request: message={data.message[:50]}..., user={data.auth_userid}")
            
            if not self.is_enabled():
                print("[Scores] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Scores cog is currently disabled"
                )
            
            try:
                # Prepare payload
                payload = {
                    "message": data.message,
                    "auth_userid": data.auth_userid,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Scores"
                }
                
                print(f"[Scores] Sending to webhook: {self.webhook_url}")
                print(f"[Scores] Payload: {payload}")
                
                # Send to n8n webhook
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"[Scores] Webhook response status: {response.status_code}")
                    
                    webhook_response = None
                    try:
                        response_data = response.json()
                        # Handle both array and dict responses from n8n
                        if isinstance(response_data, list) and len(response_data) > 0:
                            webhook_response = response_data[0]  # Take first item from array
                        elif isinstance(response_data, dict):
                            webhook_response = response_data
                        else:
                            webhook_response = {"text": str(response_data)}
                    except:
                        webhook_response = {"text": response.text}
                    
                    print(f"[Scores] Parsed webhook_response: {webhook_response}")
                    
                    # Log to history
                    self.command_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "user": data.auth_userid,
                        "message": data.message[:100],  # Store first 100 chars
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.command_history) > 100:
                        self.command_history = self.command_history[-100:]
                    
                    if response.status_code == 200:
                        return ScoreResponse(
                            success=True,
                            message="Query sent successfully",
                            webhook_response=webhook_response
                        )
                    else:
                        return ScoreResponse(
                            success=False,
                            message=f"Failed to send query (status {response.status_code})",
                            webhook_response=webhook_response
                        )
                        
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="Webhook request timed out"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to send webhook: {str(e)}"
                )
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"[Scores] Unexpected error: {str(e)}")
                print(f"[Scores] Traceback:\n{error_trace}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected error: {str(e)}"
                )
        
        @self.router.get("/history")
        async def get_command_history(limit: int = 20):
            """
            Get recent command execution history
            
            Query params:
            - limit: Number of recent entries to return (default: 20, max: 100)
            """
            limit = min(limit, 100)
            return {
                "total": len(self.command_history),
                "history": self.command_history[-limit:][::-1]  # Most recent first
            }
        
        @self.router.post("/test")
        async def test_command():
            """
            Test /scores command with sample data
            
            Sends a test query to verify webhook connectivity
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Scores cog is currently disabled"
                )
            
            test_data = ScoreRequest(
                message="Test query from VKU Toolkit - What are my scores?",
                auth_userid="test_user_123"
            )
            return await execute_command(test_data)


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = ScoreCog(app)
    cog.setup()
    cog.register_routes()
    return cog
