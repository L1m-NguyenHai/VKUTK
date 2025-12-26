"""
Announcement Cog - Fetch and manage VKU announcements

This cog provides functionality to retrieve and manage announcements from VKU.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField
import httpx

class AnnouncementRequest(BaseModel):
    """Request model for announcement operations"""
    message: str
    auth_userid: str


class AnnouncementResponse(BaseModel):
    """Response model for announcement operations"""
    success: bool
    message: str
    data: Optional[dict] = None


class AnnouncementCog(BaseCog):
    """
    Announcement Integration Plugin
    
    Provides functionality to fetch and manage VKU announcements
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="announcement",
            description="Fetch and manage VKU announcements",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Bell",
            color="from-blue-500 to-cyan-500",
            commands=[
                CommandDefinition(
                    command="announcement",
                    description="Ask a question about VKU announcements",
                    fields=[
                        CommandField(
                            name="message",
                            label="Your Question",
                            type="textarea",
                            placeholder="Enter your question here...",
                            required=True
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook/announcement"
        self.command_history = []
        
    def setup(self):
        """Setup announcement routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get announcement cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/execute", response_model=AnnouncementResponse)
        async def execute_command(data: AnnouncementRequest):
            """
            Execute /announcement command - Send question to n8n webhook
            
            Request body:
            - message: The question/message to send
            - auth_userid: User identifier from authentication
            
            Returns:
            - success: Whether webhook was sent successfully
            - message: Status message
            - webhook_response: Response from n8n webhook
            """
            print(f"[Announcement] Received execute request")
            
            if not self.is_enabled():
                print("[Announcement] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Announcement cog is currently disabled"
                )
            
            try:
                print(f"[Announcement] Processing command for user: {data.auth_userid}")
                payload = {
                    "message": data.message,
                    "auth_userid": data.auth_userid
                }

                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )

                    print(f"[Announcement] Webhook response status: {response.status_code}")

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

                    print(f"[Announcement] Parsed webhook_response: {webhook_response}")

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
                        return AnnouncementResponse(
                            success=True,
                            message=webhook_response.get('message', 'Command executed successfully') if isinstance(webhook_response, dict) else str(webhook_response),
                            data=webhook_response
                        )
                    else:
                        return AnnouncementResponse(
                            success=False,
                            message="Command execution failed",
                            data=webhook_response
                        )                
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"[Announcement] Unexpected error: {str(e)}")
                print(f"[Announcement] Traceback:\n{error_trace}")
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
            Test announcement command with sample data
            
            TODO: Implement test logic
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Announcement cog is currently disabled"
                )
            
            return AnnouncementResponse(
                success=True,
                message="Test executed successfully",
                data={}
            )


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = AnnouncementCog(app)
    cog.setup()
    cog.register_routes()
    return cog
