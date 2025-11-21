"""
Timetable Cog - Send timetable data to n8n for processing

This cog provides the /timetable command to send timetable requests to n8n webhook.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class TimetableRequest(BaseModel):
    auth_userid: str
    semester: str  # Học kỳ (1-9)
    prefer_time: Optional[str] = None  # Ưu tiên buổi (sáng/chiều)
    day_preferences: Optional[Dict[str, str]] = None  # {"Thứ 2": "prefer", "Thứ 3": "avoid", ...}
    prefer_lecturer: Optional[str] = None  # Ưu tiên giáo viên


class TimetableResponse(BaseModel):
    success: bool
    message: str
    webhook_response: Optional[dict] = None


class TimetableCog(BaseCog):
    """
    Timetable Integration Plugin
    
    Provides /timetable command to send timetable requests to n8n for processing
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Timetable",
            description="Generate and manage your class timetable",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Calendar",
            color="from-green-500 to-teal-500",
            commands=[
                CommandDefinition(
                    command="timetable",
                    description="Tạo thời khóa biểu tự động",
                    fields=[
                        CommandField(
                            name="semester",
                            label="Học kỳ",
                            type="select",
                            placeholder="Chọn học kỳ",
                            required=True,
                            options=["1", "2", "3", "4", "5", "6", "7", "8", "9"]
                        ),
                        CommandField(
                            name="prefer_time",
                            label="Ưu tiên buổi",
                            type="select",
                            placeholder="Chọn buổi học ưu tiên",
                            required=False,
                            options=["Sáng", "Chiều"]
                        ),
                        CommandField(
                            name="day_preferences",
                            label="Ưu tiên / Né thứ",
                            type="tristate",
                            placeholder="Bấm 1 lần: Ưu tiên | 2 lần: Né | 3 lần: Huỷ",
                            required=False,
                            options=["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
                        ),
                        CommandField(
                            name="prefer_lecturer",
                            label="Ưu tiên giáo viên",
                            type="text",
                            placeholder="Nhập tên giáo viên (VD: Nguyễn Văn A)",
                            required=False
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook-test/timetable"
        self.command_history = []
        
    def setup(self):
        """Setup Timetable webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Timetable cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "usage": {
                    "command": "/timetable",
                    "example": {
                        "message": "Show my timetable for this week",
                        "auth_userid": "student123"
                    }
                },
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/execute")
        async def execute_command(data: TimetableRequest):
            """Execute timetable command and send to n8n webhook"""
            
            print(f"[Timetable] Received request from user: {data.auth_userid}")
            print(f"[Timetable] Semester: {data.semester}, Prefer: {data.prefer_time}")
            
            # Check if cog is enabled
            if not self.is_enabled():
                print("[Timetable] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="Timetable cog is currently disabled"
                )
            
            try:
                # Extract prefer and avoid days from day_preferences
                prefer_days = []
                avoid_days = []
                if data.day_preferences:
                    for day, pref in data.day_preferences.items():
                        if pref == "prefer":
                            prefer_days.append(day)
                        elif pref == "avoid":
                            avoid_days.append(day)
                
                # Prepare payload
                payload = {
                    "auth_userid": data.auth_userid,
                    "semester": data.semester,
                    "prefer_time": data.prefer_time,
                    "prefer_days": prefer_days,
                    "avoid_days": avoid_days,
                    "prefer_lecturer": data.prefer_lecturer,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Timetable"
                }
                
                print(f"[Timetable] Sending to webhook: {self.webhook_url}")
                print(f"[Timetable] Payload: {payload}")
                
                # Send to n8n webhook
                async with httpx.AsyncClient(timeout=200.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"[Timetable] Webhook response status: {response.status_code}")
                    
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
                    
                    print(f"[Timetable] Parsed webhook_response: {webhook_response}")
                    
                    # Log to history
                    self.command_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "user": data.auth_userid,
                        "semester": data.semester,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.command_history) > 100:
                        self.command_history = self.command_history[-100:]
                    
                    if response.status_code == 200:
                        return TimetableResponse(
                            success=True,
                            message="Timetable request sent successfully",
                            webhook_response=webhook_response
                        )
                    else:
                        return TimetableResponse(
                            success=False,
                            message=f"Failed to send request (status {response.status_code})",
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
                print(f"[Timetable] Unexpected error: {str(e)}")
                print(f"[Timetable] Traceback:\n{error_trace}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Unexpected error: {str(e)}"
                )
        
        @self.router.get("/history")
        async def get_history():
            """Get command execution history"""
            return {
                "total": len(self.command_history),
                "history": self.command_history[-50:]  # Return last 50
            }
        
        @self.router.post("/test")
        async def test_webhook():
            """Test webhook connection"""
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        json={
                            "message": "Test connection from VKU Toolkit",
                            "auth_userid": "test_user",
                            "timestamp": datetime.now().isoformat(),
                            "source": "VKU Toolkit - Timetable Test"
                        }
                    )
                    return {
                        "success": response.status_code == 200,
                        "status_code": response.status_code,
                        "response": response.text[:500]  # First 500 chars
                    }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = TimetableCog(app)
    cog.setup()
    cog.register_routes()
    return cog
