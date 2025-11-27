"""
ChatNLP Cog - Vietnamese Text Classification

This cog provides NLP text classification functionality that sends Vietnamese text
to a local NLP API for intent prediction and classification.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import httpx
from datetime import datetime
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class ChatNLPRequest(BaseModel):
    """ChatNLP request payload"""
    text: str
    auth_userid: Optional[str] = "anonymous"


class ChatNLPResponse(BaseModel):
    """ChatNLP response"""
    success: bool
    message: str
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    api_response: Optional[dict] = None


class ChatNLPCog(BaseCog):
    """
    ChatNLP Plugin
    
    Provides Vietnamese text classification and intent prediction
    through local NLP API endpoint
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="ChatNLP",
            description="Vietnamese text classification and intent prediction",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="Brain",
            color="from-purple-500 to-indigo-500",
            commands=[
                CommandDefinition(
                    command="nlp",
                    description="Classify Vietnamese text using NLP",
                    fields=[
                        CommandField(
                            name="text",
                            label="Vietnamese Text",
                            type="textarea",
                            placeholder="Nhập văn bản tiếng Việt cần phân loại...",
                            required=True
                        )
                    ]
                )
            ]
        )
        self.api_url = "http://localhost:5000/predict"
        self.prediction_history: List[Dict] = []
        
    def setup(self):
        """Setup ChatNLP routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get ChatNLP cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "api_url": self.api_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "endpoints": {
                    "execute": "POST /execute - Classify Vietnamese text",
                    "history": "GET /history - Get prediction history",
                    "clear": "POST /clear - Clear prediction history",
                    "test": "POST /test - Test API connectivity"
                },
                "features": {
                    "language": "Vietnamese text classification",
                    "intent_detection": "Detects user intent from text",
                    "confidence_score": "Returns prediction confidence",
                    "history_tracking": "Stores recent predictions"
                },
                "usage": {
                    "command": "/nlp",
                    "example": {
                        "text": "con chó lày",
                        "auth_userid": "optional_user_id"
                    }
                },
                "total_predictions": len(self.prediction_history)
            }
        
        @self.router.post("/execute", response_model=ChatNLPResponse)
        async def execute_command(request: ChatNLPRequest):
            """
            Execute /nlp command - Classify Vietnamese text
            
            Request body:
            - text: Vietnamese text to classify (REQUIRED)
            - auth_userid: User identifier (Optional, default: "anonymous")
            
            Returns:
            - success: Whether classification was successful
            - message: Status message
            - prediction: Predicted class/intent
            - confidence: Prediction confidence score (0-1)
            - api_response: Full response from NLP API
            """
            print(f"[ChatNLP] Received execute request: text='{request.text[:50]}...', user={request.auth_userid}")
            
            if not self.is_enabled():
                print("[ChatNLP] Cog is disabled")
                raise HTTPException(
                    status_code=403,
                    detail="ChatNLP cog is currently disabled"
                )
            
            try:
                # Validate required fields
                if not request.text or not request.text.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="text is required and cannot be empty"
                    )
                
                # Prepare payload for NLP API
                payload = {
                    "text": request.text.strip()
                }
                
                print(f"[ChatNLP] Sending to API: {self.api_url}")
                print(f"[ChatNLP] Payload: text='{request.text[:50]}...', user={request.auth_userid}")
                
                # Send to NLP API
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.api_url,
                        json=payload
                    )
                    
                    print(f"[ChatNLP] API response status: {response.status_code}")
                    
                    api_response = None
                    prediction = None
                    confidence = None
                    
                    try:
                        response_data = response.json()
                        api_response = response_data
                        
                        # Extract prediction and confidence from response
                        if isinstance(response_data, dict):
                            prediction = (
                                response_data.get("prediction") or
                                response_data.get("class") or
                                response_data.get("intent") or
                                response_data.get("label")
                            )
                            
                            confidence = (
                                response_data.get("confidence") or
                                response_data.get("probability") or
                                response_data.get("score")
                            )
                            
                            # Convert confidence to float if it's a string
                            if confidence is not None and isinstance(confidence, str):
                                try:
                                    confidence = float(confidence)
                                except ValueError:
                                    confidence = None
                        
                    except Exception as parse_error:
                        print(f"[ChatNLP] Error parsing API response: {str(parse_error)}")
                        api_response = {"text": response.text[:500]}
                        prediction = response.text[:100]
                    
                    print(f"[ChatNLP] Prediction: {prediction}, Confidence: {confidence}")
                    
                    # Log to history
                    self.prediction_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "auth_userid": request.auth_userid,
                        "input_text": request.text,
                        "prediction": prediction,
                        "confidence": confidence,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.prediction_history) > 100:
                        self.prediction_history = self.prediction_history[-100:]
                    
                    if response.status_code == 200:
                        return ChatNLPResponse(
                            success=True,
                            message="Text classified successfully",
                            prediction=prediction,
                            confidence=confidence,
                            api_response=api_response
                        )
                    else:
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"NLP API returned error: {response.text[:200]}"
                        )
                    
            except HTTPException:
                raise
            except httpx.ConnectError:
                print(f"[ChatNLP] Connection error: Cannot connect to {self.api_url}")
                raise HTTPException(
                    status_code=503,
                    detail=f"Cannot connect to NLP API at {self.api_url}. Please ensure the service is running."
                )
            except Exception as e:
                print(f"[ChatNLP] Error: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to classify text: {str(e)}"
                )
        
        @self.router.get("/history")
        async def get_history(
            auth_userid: Optional[str] = None,
            limit: int = 50
        ):
            """
            Get prediction history
            
            Query params:
            - auth_userid: Filter by user (optional)
            - limit: Maximum number of predictions to return (default: 50)
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="ChatNLP cog is currently disabled"
                )
            
            # Filter history
            filtered_history = self.prediction_history
            
            if auth_userid:
                filtered_history = [h for h in filtered_history if h.get("auth_userid") == auth_userid]
            
            # Apply limit
            filtered_history = filtered_history[-limit:]
            
            return {
                "total": len(filtered_history),
                "history": filtered_history,
                "auth_userid_filter": auth_userid
            }
        
        @self.router.post("/clear")
        async def clear_history(
            auth_userid: Optional[str] = None
        ):
            """
            Clear prediction history
            
            Query params:
            - auth_userid: Clear only for specific user (optional)
            
            If no filter provided, clears all history
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="ChatNLP cog is currently disabled"
                )
            
            original_count = len(self.prediction_history)
            
            if auth_userid:
                # Selective clearing
                self.prediction_history = [
                    h for h in self.prediction_history
                    if h.get("auth_userid") != auth_userid
                ]
                cleared_count = original_count - len(self.prediction_history)
            else:
                # Clear all
                cleared_count = len(self.prediction_history)
                self.prediction_history = []
            
            return {
                "success": True,
                "message": f"Cleared {cleared_count} prediction(s) from history",
                "remaining": len(self.prediction_history)
            }
        
        @self.router.post("/test", response_model=ChatNLPResponse)
        async def test_api():
            """Test NLP API connectivity"""
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="ChatNLP cog is currently disabled"
                )
            
            try:
                test_payload = {
                    "text": "con chó lày"
                }
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        self.api_url,
                        json=test_payload
                    )
                    
                    api_response = None
                    prediction = None
                    confidence = None
                    
                    try:
                        response_data = response.json()
                        api_response = response_data
                        
                        if isinstance(response_data, dict):
                            prediction = response_data.get("prediction")
                            confidence = response_data.get("confidence")
                            
                            if confidence is not None and isinstance(confidence, str):
                                try:
                                    confidence = float(confidence)
                                except ValueError:
                                    confidence = None
                    except Exception as parse_error:
                        print(f"[ChatNLP] Error parsing API response: {str(parse_error)}")
                        api_response = {"text": response.text[:200]}
                    
                    return ChatNLPResponse(
                        success=response.status_code == 200,
                        message=f"Test completed with status {response.status_code}",
                        prediction=prediction,
                        confidence=confidence,
                        api_response=api_response
                    )
                    
            except httpx.ConnectError:
                raise HTTPException(
                    status_code=503,
                    detail=f"Cannot connect to NLP API at {self.api_url}. Please ensure the service is running."
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Test failed: {str(e)}"
                )


# Required for auto-loading
def setup(app: FastAPI):
    """Setup function called by the plugin loader"""
    cog = ChatNLPCog(app)
    cog.setup()
    cog.register_routes()
    return cog
