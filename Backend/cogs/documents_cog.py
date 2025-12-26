"""
Documents Cog - Send document queries to n8n for document processing

This cog provides the /documents command to send document requests to n8n webhook.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class DocumentsRequest(BaseModel):
    message: str
    auth_userid: str


class DocumentsResponse(BaseModel):
    success: bool
    message: str
    webhook_response: Optional[dict] = None


class DocumentsCog(BaseCog):
    """
    Documents Integration Plugin
    
    Provides /documents command to send document queries to n8n for processing
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Documents",
            description="Send document queries to n8n",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="FileText",
            color="from-blue-500 to-cyan-500",
            commands=[
                CommandDefinition(
                    command="documents",
                    description="Send a document query",
                    fields=[
                        CommandField(
                            name="message",
                            label="Your Query",
                            type="textarea",
                            placeholder="Enter your document query here...",
                            required=True
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook/chat-documents"
        self.command_history = []
        
    def setup(self):
        """Setup Documents webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Documents cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "usage": {
                    "command": "/documents",
                    "example": {
                        "message": "What are the key points in the document?",
                        "auth_userid": "student123"
                    }
                },
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/execute", response_model=DocumentsResponse)
        async def execute_command(data: DocumentsRequest):
            """
            Execute /documents command - Send query to n8n webhook
            
            Request body:
            - message: The query/message to send
            - auth_userid: User identifier from authentication
            
            Returns:
            - success: Whether webhook was sent successfully
            - message: Status message
            - webhook_response: Response from n8n webhook
            """
            print(f"[Documents] Received execute request: message={data.message[:50]}..., user={data.auth_userid}")
            
            if not self.is_enabled():
                print("[Documents] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Documents cog is currently disabled"
                )
            
            try:
                # Prepare payload
                payload = {
                    "message": data.message,
                    "auth_userid": data.auth_userid,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Documents"
                }
                
                print(f"[Documents] Sending to webhook: {self.webhook_url}")
                print(f"[Documents] Payload: {payload}")
                
                # Send to n8n webhook
                async with httpx.AsyncClient(timeout=3600.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"[Documents] Webhook response status: {response.status_code}")
                    
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
                    
                    print(f"[Documents] Parsed webhook_response: {webhook_response}")
                    
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
                        return DocumentsResponse(
                            success=True,
                            message="Document query sent successfully",
                            webhook_response=webhook_response
                        )
                    else:
                        return DocumentsResponse(
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
                print(f"[Documents] Unexpected error: {str(e)}")
                print(f"[Documents] Traceback:\n{error_trace}")
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
            Test /documents command with sample data
            
            Sends a test query to verify webhook connectivity
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Documents cog is currently disabled"
                )
            
            test_data = DocumentsRequest(
                message="Test query from VKU Toolkit - What is this document about?",
                auth_userid="test_user_123"
            )
            return await execute_command(test_data)


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = DocumentsCog(app)
    cog.setup()
    cog.register_routes()
    return cog
