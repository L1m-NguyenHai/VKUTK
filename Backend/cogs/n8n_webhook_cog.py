"""
N8N Webhook Cog - Integration with n8n automation platform

This cog provides webhook endpoints for n8n workflows.
Example use cases:
- Send notifications when grades are updated
- Automate data sync to external systems
- Trigger workflows based on VKU events
"""

from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from .base_cog import BaseCog, CogMetadata


class WebhookRequest(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: Optional[str] = None


class N8NWebhookCog(BaseCog):
    """
    N8N Webhook Plugin
    
    Provides endpoints for n8n automation workflows.
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="N8N Webhook",
            description="Integration with n8n automation platform",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Webhook",
            color="from-orange-500 to-red-500"
        )
        self.webhook_logs = []  # Store recent webhook calls
        
    def setup(self):
        """Setup webhook routes"""
        
        @self.router.get("/")
        async def get_webhook_info():
            """Get webhook information and usage"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "endpoints": {
                    "POST /api/plugins/n8nwebhook/trigger": "Main webhook endpoint for n8n",
                    "POST /api/plugins/n8nwebhook/grades": "Webhook for grade updates",
                    "POST /api/plugins/n8nwebhook/student": "Webhook for student info updates",
                    "GET /api/plugins/n8nwebhook/logs": "View recent webhook calls"
                },
                "usage": {
                    "n8n_setup": [
                        "1. In n8n, add a Webhook node",
                        "2. Set Method: POST",
                        "3. Set URL: http://your-server:8000/api/plugins/n8nwebhook/trigger",
                        "4. Send JSON data in request body"
                    ]
                },
                "total_calls": len(self.webhook_logs)
            }
        
        @self.router.post("/trigger")
        async def webhook_trigger(request: Request):
            """
            Main webhook endpoint for n8n
            
            Usage in n8n:
            - Method: POST
            - URL: http://localhost:8000/api/plugins/n8nwebhook/trigger
            - Body (JSON):
              {
                "event": "custom_event",
                "data": { ... your data ... }
              }
            """
            try:
                body = await request.json()
                
                # Log the webhook call
                log_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "endpoint": "/trigger",
                    "data": body
                }
                self.webhook_logs.append(log_entry)
                
                # Keep only last 50 logs
                if len(self.webhook_logs) > 50:
                    self.webhook_logs = self.webhook_logs[-50:]
                
                return {
                    "success": True,
                    "message": "Webhook received",
                    "received_at": log_entry["timestamp"],
                    "data": body
                }
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
        
        @self.router.post("/grades")
        async def webhook_grades(data: Dict[str, Any]):
            """
            Webhook for grade updates
            
            This endpoint can be called when new grades are added.
            You can configure it to send notifications via n8n.
            
            Example body:
            {
              "student_id": "2051050001",
              "course": "Lập trình Python",
              "grade": 9.5,
              "semester": "HK1"
            }
            """
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "endpoint": "/grades",
                "data": data
            }
            self.webhook_logs.append(log_entry)
            
            if len(self.webhook_logs) > 50:
                self.webhook_logs = self.webhook_logs[-50:]
            
            return {
                "success": True,
                "message": "Grade webhook processed",
                "data": data
            }
        
        @self.router.post("/student")
        async def webhook_student(data: Dict[str, Any]):
            """
            Webhook for student info updates
            
            Example body:
            {
              "student_id": "2051050001",
              "action": "updated",
              "changes": ["email", "phone"]
            }
            """
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "endpoint": "/student",
                "data": data
            }
            self.webhook_logs.append(log_entry)
            
            if len(self.webhook_logs) > 50:
                self.webhook_logs = self.webhook_logs[-50:]
            
            return {
                "success": True,
                "message": "Student webhook processed",
                "data": data
            }
        
        @self.router.get("/logs")
        async def get_webhook_logs(limit: int = 20):
            """Get recent webhook call logs"""
            return {
                "success": True,
                "total": len(self.webhook_logs),
                "logs": self.webhook_logs[-limit:]
            }
        
        @self.router.delete("/logs")
        async def clear_webhook_logs():
            """Clear all webhook logs"""
            self.webhook_logs.clear()
            return {
                "success": True,
                "message": "Webhook logs cleared"
            }
    
    def cleanup(self):
        """Cleanup when cog is unloaded"""
        self.webhook_logs.clear()
        print(f"[{self.metadata.name}] Cleaned up")


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = N8NWebhookCog(app)
    cog.setup()
    cog.register_routes()
    return cog
