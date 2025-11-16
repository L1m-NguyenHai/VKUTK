"""
Example Cog - Template for creating new plugins

This is a sample cog showing how to structure your plugin.
Copy this file and modify it to create your own plugin.
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from .base_cog import BaseCog, CogMetadata


class ExampleRequest(BaseModel):
    message: str
    user_id: Optional[str] = None


class ExampleResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ExampleCog(BaseCog):
    """
    Example Plugin demonstrating cog structure
    
    This cog shows:
    - How to define metadata
    - How to register routes
    - How to handle requests/responses
    - How to use dependencies
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Example Plugin",
            description="Template plugin showing how to create cogs",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Zap",
            color="from-purple-500 to-pink-500"
        )
        self.data_store = {}  # Simple in-memory storage for demo
        
    def setup(self):
        """Setup routes for this plugin"""
        
        @self.router.get("/info")
        async def get_plugin_info():
            """Get information about this plugin"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "version": self.metadata.version,
                "endpoints": [
                    "/info - Get plugin info",
                    "/echo - Echo a message",
                    "/data - Get stored data",
                    "/webhook - Example webhook endpoint"
                ]
            }
        
        @self.router.post("/echo", response_model=ExampleResponse)
        async def echo_message(request: ExampleRequest):
            """Echo back the message"""
            return ExampleResponse(
                success=True,
                message=f"Echo: {request.message}",
                data={"original": request.message}
            )
        
        @self.router.get("/data")
        async def get_data():
            """Get all stored data"""
            return {
                "success": True,
                "data": self.data_store
            }
        
        @self.router.post("/data")
        async def save_data(key: str, value: str):
            """Save data to memory"""
            self.data_store[key] = value
            return {
                "success": True,
                "message": f"Saved {key}",
                "data": self.data_store
            }
        
        @self.router.post("/webhook")
        async def webhook_endpoint(data: dict):
            """
            Example webhook endpoint
            This shows how to create endpoints for services like n8n
            
            Usage with n8n:
            - Method: POST
            - URL: http://localhost:8000/api/plugins/example/webhook
            - Body: JSON data
            """
            print(f"[Example Cog] Webhook received: {data}")
            
            # Process webhook data here
            # You can call other APIs, save to database, etc.
            
            return {
                "success": True,
                "message": "Webhook processed",
                "received_data": data,
                "timestamp": self.loaded_at.isoformat()
            }
    
    def cleanup(self):
        """Cleanup when cog is unloaded"""
        self.data_store.clear()
        print(f"[{self.metadata.name}] Cleaned up")


# This is required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = ExampleCog(app)
    cog.setup()
    cog.register_routes()
    return cog
