"""
Summary Cog - Send document and file queries to n8n for summarization

This cog provides the /summary command to send queries and files to n8n webhook.
Supports file uploads in binary format (PDF, DOCX, TXT, etc).
File upload is REQUIRED for /summary command.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
import io
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class SummaryResponse(BaseModel):
    success: bool
    message: str
    webhook_response: Optional[dict] = None


class SummaryCog(BaseCog):
    """
    Summary Integration Plugin
    
    Provides /summary command to send queries and files to n8n for summarization
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Summary",
            description="Send queries and files to n8n for summarization",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Briefcase",
            color="from-indigo-500 to-purple-500",
            commands=[
                CommandDefinition(
                    command="summary",
                    description="Send a file with query for summarization (file required)",
                    fields=[
                        CommandField(
                            name="message",
                            label="Your Query",
                            type="textarea",
                            placeholder="Enter your query here...",
                            required=True
                        ),
                        CommandField(
                            name="file",
                            label="Upload File",
                            type="file",
                            placeholder="Select PDF, DOCX, or TXT file...",
                            required=True
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook/summary"
        self.command_history = []
        
    def setup(self):
        """Setup Summary webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Summary cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "endpoints": {
                    "execute": "POST /execute - Send file with query for summarization (file required)",
                    "upload": "POST /upload - Simplified file upload (file required, message optional)",
                    "history": "GET /history - Get command history",
                    "test": "POST /test - Test webhook connectivity",
                    "debug": "POST /debug - Debug endpoint for troubleshooting"
                },
                "supported_file_types": ["pdf", "txt", "docx", "doc", "pptx"],
                "usage": {
                    "command": "/summary",
                    "note": "File upload is REQUIRED for /summary command",
                    "content_type": "multipart/form-data",
                    "fields": {
                        "message": "string (REQUIRED) - Your query",
                        "file": "file (REQUIRED) - PDF, DOCX, TXT, etc",
                        "auth_userid": "string (Optional) - User ID, default: anonymous"
                    },
                    "example": {
                        "message": "Please summarize this document - highlight key points",
                        "file": "document.pdf (REQUIRED)"
                    }
                },
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/debug")
        async def debug_request(
            message: str = Form(default=""),
            file: UploadFile = File(default=None)
        ):
            """Debug endpoint to see what data is being received"""
            return {
                "received": {
                    "message": message if message else "[no message]",
                    "file_name": file.filename if file else "[no file]",
                    "file_size": len(await file.read()) if file else 0,
                    "content_type": file.content_type if file else "[no file]"
                },
                "status": "Debug received successfully"
            }
        
        
        @self.router.post("/execute", response_model=SummaryResponse)
        async def execute_command(
            message: str = Form(...),
            auth_userid: str = Form(default="anonymous"),
            file: UploadFile = File(...)
        ):
            """
            Execute /summary command - Upload file with query for summarization
            
            Form data:
            - message: The query/message to send (REQUIRED)
            - auth_userid: User identifier from authentication (Optional, default: "anonymous")
            - file: File to upload (REQUIRED) - PDF, TXT, DOCX, etc
            
            Returns:
            - success: Whether webhook was sent successfully
            - message: Status message
            - webhook_response: Response from n8n webhook
            """
            print(f"[Summary] Received execute request: filename={file.filename}, user={auth_userid}")
            
            if not self.is_enabled():
                print("[Summary] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Summary cog is currently disabled"
                )
            
            try:
                # Validate file
                if not file.filename:
                    raise HTTPException(
                        status_code=400,
                        detail="No file provided (file is REQUIRED)"
                    )
                
                # Check file extension
                allowed_extensions = ["pdf", "txt", "docx", "doc", "pptx"]
                file_ext = file.filename.split(".")[-1].lower()
                if file_ext not in allowed_extensions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File type .{file_ext} not allowed. Allowed: {', '.join(allowed_extensions)}"
                    )
                
                # Read file content as binary
                file_content = await file.read()
                print(f"[Summary] File size: {len(file_content)} bytes")
                
                # Prepare multipart payload
                print(f"[Summary] Sending to webhook: {self.webhook_url} with file")
                
                # Create multipart form data
                form_data = {
                    "message": (None, message),
                    "auth_userid": (None, auth_userid),
                    "timestamp": (None, datetime.now().isoformat()),
                    "source": (None, "VKU Toolkit - Summary"),
                }
                
                # Add file as binary
                files = {
                    "file": (file.filename, io.BytesIO(file_content), file.content_type or "application/octet-stream")
                }
                
                print(f"[Summary] Payload: message={message[:50]}..., user={auth_userid}, file={file.filename}")
                
                # Send to n8n webhook with multipart form data
                async with httpx.AsyncClient(timeout=3600.0) as client:  # Longer timeout for file uploads
                    response = await client.post(
                        self.webhook_url,
                        data=form_data,
                        files=files
                    )
                    
                    print(f"[Summary] Webhook response status: {response.status_code}")
                    
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
                        webhook_response = {"text": response.text[:200]}  # Limit text length
                    
                    print(f"[Summary] Parsed webhook_response: {webhook_response}")
                    
                    # Log to history
                    self.command_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "user": auth_userid,
                        "message": message[:100],  # Store first 100 chars
                        "file": file.filename,
                        "file_size": len(file_content),
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.command_history) > 100:
                        self.command_history = self.command_history[-100:]
                    
                    if response.status_code == 200:
                        return SummaryResponse(
                            success=True,
                            message=f"File '{file.filename}' sent successfully for summarization",
                            webhook_response=webhook_response
                        )
                    else:
                        return SummaryResponse(
                            success=False,
                            message=f"Failed to send file (status {response.status_code})",
                            webhook_response=webhook_response
                        )
                        
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="File upload request timed out"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to send webhook: {str(e)}"
                )
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"[Summary] Unexpected error: {str(e)}")
                print(f"[Summary] Traceback:\n{error_trace}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected error: {str(e)}"
                )
        
        @self.router.post("/upload", response_model=SummaryResponse)
        async def upload_endpoint(
            message: str = Form(default=""),
            file: UploadFile = File(...)
        ):
            """
            Alternative upload endpoint with simplified parameters
            
            Form data:
            - message: The query/message to send (Optional)
            - file: File to upload (REQUIRED)
            
            Note: This endpoint extracts auth_userid from token if available, otherwise uses 'anonymous'
            """
            print(f"[Summary] Received upload request: filename={file.filename}")
            
            # Get auth_userid from somewhere (for now, default to anonymous)
            auth_userid = "anonymous"
            
            # Re-route to execute_command
            return await execute_command(message, auth_userid, file)

        
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
            Test /summary command with sample file upload
            
            Note: This is a test endpoint. In production, /execute should be called 
            from the frontend with actual file upload via multipart form-data.
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Summary cog is currently disabled"
                )
            
            # Create test file content
            test_file_content = b"This is a test PDF document.\n\nTest content from VKU Toolkit.\n\nPlease summarize this test document."
            
            print("[Summary] Test command initiated")
            
            try:
                # Prepare multipart form data with test file
                form_data = {
                    "message": (None, "Test query from VKU Toolkit - Please summarize this document"),
                    "auth_userid": (None, "test_user_123"),
                    "timestamp": (None, datetime.now().isoformat()),
                    "source": (None, "VKU Toolkit - Summary - TEST"),
                }
                
                files = {
                    "file": ("test_document.txt", io.BytesIO(test_file_content), "text/plain")
                }
                
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        data=form_data,
                        files=files
                    )
                    
                    webhook_response = None
                    try:
                        response_data = response.json()
                        if isinstance(response_data, list) and len(response_data) > 0:
                            webhook_response = response_data[0]
                        elif isinstance(response_data, dict):
                            webhook_response = response_data
                        else:
                            webhook_response = {"text": str(response_data)}
                    except:
                        webhook_response = {"text": response.text[:200]}
                    
                    return SummaryResponse(
                        success=response.status_code == 200,
                        message=f"Test completed with status {response.status_code}",
                        webhook_response=webhook_response
                    )
                    
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Test failed: {str(e)}"
                )


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = SummaryCog(app)
    cog.setup()
    cog.register_routes()
    return cog
