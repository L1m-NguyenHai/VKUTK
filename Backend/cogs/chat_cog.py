"""
Chat Cog - AI Chatbot integration

This cog provides chat functionality that sends messages to n8n webhook for AI processing.
Supports conversational interactions with context awareness.
"""

from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
import httpx
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str  # user or assistant
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Chat request payload"""
    message: str
    auth_userid: Optional[str] = "anonymous"
    conversation_id: Optional[str] = None
    context: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    """Chat response"""
    success: bool
    message: str
    response: Optional[str] = None
    webhook_response: Optional[dict] = None
    conversation_id: Optional[str] = None


class ChatCog(BaseCog):
    """
    Chat Plugin
    
    Provides conversational AI interface through n8n webhook
    Supports context-aware conversations and message history
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Chat",
            description="AI Chatbot for conversational interactions",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="MessageCircle",
            color="from-blue-500 to-cyan-500",
            commands=[]  # No slash commands - direct chat only
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook/chat"
        self.chat_history: List[Dict] = []
        
    def setup(self):
        """Setup Chat webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Chat cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "endpoints": {
                    "send": "POST /send - Direct chat (main endpoint)",
                    "execute": "POST /execute - Legacy command endpoint",
                    "history": "GET /history - Get chat history",
                    "clear": "POST /clear - Clear chat history",
                    "test": "POST /test - Test webhook connectivity"
                },
                "features": {
                    "context_awareness": "Maintains conversation context",
                    "user_tracking": "Tracks conversations by auth_userid",
                    "history": "Stores recent chat interactions"
                },
                "usage": {
                    "endpoint": "/send",
                    "method": "POST (multipart/form-data)",
                    "example": {
                        "message": "What is VKU?",
                        "auth_userid": "optional_user_id",
                        "file": "optional_file_attachment"
                    }
                },
                "total_messages": len(self.chat_history)
            }
        
        @self.router.post("/execute", response_model=ChatResponse)
        async def execute_command(request: ChatRequest):
            """
            Execute /chat command - Send message to AI chatbot
            
            Request body:
            - message: User message (REQUIRED)
            - auth_userid: User identifier (Optional, default: "anonymous")
            - conversation_id: Conversation identifier for context (Optional)
            - context: Previous messages for context (Optional)
            
            Returns:
            - success: Whether message was processed successfully
            - message: Status message
            - response: AI chatbot response
            - webhook_response: Full response from n8n webhook
            - conversation_id: Conversation identifier
            """
            print(f"[Chat] Received execute request: message='{request.message[:50]}...', user={request.auth_userid}")
            
            if not self.is_enabled():
                print("[Chat] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Chat cog is currently disabled"
                )
            
            try:
                # Validate required fields
                if not request.message or not request.message.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="message is required and cannot be empty"
                    )
                
                # Prepare payload for webhook
                payload = {
                    "message": request.message.strip(),
                    "auth_userid": request.auth_userid,
                    "conversation_id": request.conversation_id,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Chat"
                }
                
                # Add context if provided
                if request.context and len(request.context) > 0:
                    payload["context"] = [msg.model_dump() for msg in request.context]
                
                print(f"[Chat] Sending to webhook: {self.webhook_url}")
                print(f"[Chat] Payload: message='{request.message[:50]}...', user={request.auth_userid}, conv_id={request.conversation_id}")
                
                # Send to n8n webhook
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload
                    )
                    
                    print(f"[Chat] Webhook response status: {response.status_code}")
                    
                    webhook_response = None
                    ai_response = None
                    conversation_id = request.conversation_id
                    
                    try:
                        response_data = response.json()
                        # Handle both array and dict responses from n8n
                        if isinstance(response_data, list) and len(response_data) > 0:
                            webhook_response = response_data[0]
                        elif isinstance(response_data, dict):
                            webhook_response = response_data
                        else:
                            webhook_response = {"text": str(response_data)}
                        
                        # Extract AI response from webhook response
                        if isinstance(webhook_response, dict):
                            # Try common response field names
                            ai_response = (
                                webhook_response.get("response") or
                                webhook_response.get("message") or
                                webhook_response.get("reply") or
                                webhook_response.get("text") or
                                webhook_response.get("output")
                            )
                            
                            # Extract conversation_id if provided by webhook
                            if "conversation_id" in webhook_response:
                                conversation_id = webhook_response["conversation_id"]
                        
                        if not ai_response:
                            ai_response = str(webhook_response)
                        
                    except Exception as parse_error:
                        import traceback
                        print(f"[Chat] Error parsing webhook response: {str(parse_error)}")
                        traceback.print_exc()
                        webhook_response = {"text": response.text[:500]}
                        ai_response = response.text[:500]
                    
                    print(f"[Chat] AI response: {ai_response[:100] if ai_response else 'None'}...")
                    
                    # Log to history
                    self.chat_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "auth_userid": request.auth_userid,
                        "conversation_id": conversation_id,
                        "user_message": request.message,
                        "ai_response": ai_response,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.chat_history) > 100:
                        self.chat_history = self.chat_history[-100:]
                    
                    if response.status_code == 200:
                        return ChatResponse(
                            success=True,
                            message="Message processed successfully",
                            response=ai_response,
                            webhook_response=webhook_response,
                            conversation_id=conversation_id
                        )
                    else:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"Webhook returned error: {response.text[:200]}"
                        )
                    
            except HTTPException:
                raise
            except Exception as e:
                import traceback
                print(f"[Chat] Error: {str(e)}")
                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to process chat message: {str(e)}"
                )
        
        @self.router.get("/history")
        async def get_history(
            auth_userid: Optional[str] = None,
            conversation_id: Optional[str] = None,
            limit: int = 50
        ):
            """
            Get chat history
            
            Query params:
            - auth_userid: Filter by user (optional)
            - conversation_id: Filter by conversation (optional)
            - limit: Maximum number of messages to return (default: 50)
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Chat cog is currently disabled"
                )
            
            # Filter history
            filtered_history = self.chat_history
            
            if auth_userid:
                filtered_history = [h for h in filtered_history if h.get("auth_userid") == auth_userid]
            
            if conversation_id:
                filtered_history = [h for h in filtered_history if h.get("conversation_id") == conversation_id]
            
            # Apply limit
            filtered_history = filtered_history[-limit:]
            
            return {
                "total": len(filtered_history),
                "history": filtered_history,
                "auth_userid_filter": auth_userid,
                "conversation_id_filter": conversation_id
            }
        
        @self.router.post("/clear")
        async def clear_history(
            auth_userid: Optional[str] = None,
            conversation_id: Optional[str] = None
        ):
            """
            Clear chat history
            
            Query params:
            - auth_userid: Clear only for specific user (optional)
            - conversation_id: Clear only for specific conversation (optional)
            
            If no filters provided, clears all history
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Chat cog is currently disabled"
                )
            
            original_count = len(self.chat_history)
            
            if auth_userid or conversation_id:
                # Selective clearing
                self.chat_history = [
                    h for h in self.chat_history
                    if (auth_userid and h.get("auth_userid") != auth_userid) or
                       (conversation_id and h.get("conversation_id") != conversation_id)
                ]
                cleared_count = original_count - len(self.chat_history)
            else:
                # Clear all
                cleared_count = len(self.chat_history)
                self.chat_history = []
            
            return {
                "success": True,
                "message": f"Cleared {cleared_count} message(s) from history",
                "remaining": len(self.chat_history)
            }
        
        @self.router.post("/test", response_model=ChatResponse)
        async def test_webhook():
            """Test webhook connectivity"""
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Chat cog is currently disabled"
                )
            
            try:
                test_payload = {
                    "message": "Test message from VKU Toolkit",
                    "auth_userid": "test_user",
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Chat Test"
                }
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=test_payload
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
                    except Exception as parse_error:
                        print(f"[Chat] Error parsing webhook response: {str(parse_error)}")
                        webhook_response = {"text": response.text[:200]}
                    
                    return ChatResponse(
                        success=response.status_code == 200,
                        message=f"Test completed with status {response.status_code}",
                        webhook_response=webhook_response
                    )
                    
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Test failed: {str(e)}"
                )

        @self.router.post("/send")
        async def send_message(
            request: Request,
            message: Optional[str] = Form(None),
            auth_userid: str = Form("anonymous"),
            conversation_id: Optional[str] = Form(None),
            file: Optional[UploadFile] = File(None)
        ):
            """
            Direct chat endpoint - Send message without /chat command
            This is the main endpoint for the chatbot panel in Frontend.
            Supports multipart/form-data for file uploads.
            
            Form fields:
            - message: User message (REQUIRED)
            - auth_userid: User identifier (Optional, default: "anonymous")
            - file: Optional file attachment
            
            Returns:
            - success: Whether message was processed successfully
            - message: AI response text (for easy Frontend parsing)
            - response: AI chatbot response (alias)
            - webhook_response: Full response from n8n webhook
            """
            try:
                # Log request headers and whether this arrived as form or JSON
                ct = request.headers.get("content-type", "")
                print(f"[Chat] Request content-type: {ct}")
                if "application/json" in ct:
                    try:
                        json_body = await request.json()
                        print(f"[Chat] JSON body: {json_body}")
                        # Overwrite fields with JSON values if provided
                        message = json_body.get("message", message)
                        auth_userid = json_body.get("auth_userid", auth_userid)
                        # Support conversation_id if present in JSON
                        if "conversation_id" in json_body:
                            conversation_id = json_body.get("conversation_id")
                    except Exception as e:
                        print(f"[Chat] Failed to parse JSON body: {e}")
                else:
                    try:
                        form = await request.form()
                        form_keys = list(form.keys())
                        print(f"[Chat] Form keys: {form_keys}")
                    except Exception as e:
                        print(f"[Chat] Failed to read form data: {e}")
            except Exception:
                pass

            # Print direct send summary after JSON/form parsing so message may be available
            try:
                mstr = message if message is not None else "(none)"
                if isinstance(mstr, str) and len(mstr) > 50:
                    summary = mstr[:50]
                else:
                    summary = mstr
                print(f"[Chat] Direct send: message='{summary}', user={auth_userid}, file={file.filename if file else 'None'}")
            except Exception:
                pass
            except Exception:
                pass
            
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Chat cog is currently disabled"
                )
            
            try:
                if not message or not message.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="message is required and cannot be empty"
                    )
                
                # Prepare payload for webhook
                payload = {
                    "message": message.strip(),
                    "auth_userid": auth_userid,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Chat"
                }
                
                # Handle file if provided
                file_content = None
                if file:
                    file_content = await file.read()
                    payload["file_name"] = file.filename
                    payload["file_size"] = len(file_content)
                    payload["file_type"] = file.content_type
                
                print(f"[Chat] Sending to webhook: {self.webhook_url}")
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    # If file is attached, send as multipart, otherwise JSON
                    if file_content:
                        files = {"file": (file.filename, file_content, file.content_type)}
                        response = await client.post(
                            self.webhook_url,
                            data=payload,
                            files=files
                        )
                    else:
                        response = await client.post(
                            self.webhook_url,
                            json=payload
                        )
                    
                    print(f"[Chat] Webhook response status: {response.status_code}")
                    
                    webhook_response = None
                    ai_response = None
                    
                    try:
                        response_data = response.json()
                        if isinstance(response_data, list) and len(response_data) > 0:
                            webhook_response = response_data[0]
                        elif isinstance(response_data, dict):
                            webhook_response = response_data
                        else:
                            webhook_response = {"text": str(response_data)}
                        
                        if isinstance(webhook_response, dict):
                            ai_response = (
                                webhook_response.get("response") or
                                webhook_response.get("message") or
                                webhook_response.get("reply") or
                                webhook_response.get("text") or
                                webhook_response.get("output")
                            )
                        
                        if not ai_response:
                            ai_response = str(webhook_response)
                        
                    except Exception as parse_error:
                        print(f"[Chat] Error parsing webhook response: {str(parse_error)}")
                        webhook_response = {"text": response.text[:500]}
                        ai_response = response.text[:500]
                    
                    print(f"[Chat] AI response: {ai_response[:100] if ai_response else 'None'}...")
                    
                    # Log to history
                    self.chat_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "auth_userid": auth_userid,
                        "user_message": message,
                        "ai_response": ai_response,
                        "has_file": file is not None,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    if len(self.chat_history) > 100:
                        self.chat_history = self.chat_history[-100:]
                    
                    if response.status_code == 200:
                        return {
                            "success": True,
                            "message": ai_response,  # AI response in message field for easy parsing
                            "response": ai_response,
                            "webhook_response": webhook_response
                        }
                    else:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"Webhook returned error: {response.text[:200]}"
                        )
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"[Chat] Error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to process chat message: {str(e)}"
                )


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = ChatCog(app)
    cog.setup()
    cog.register_routes()
    return cog
