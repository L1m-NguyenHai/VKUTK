"""
Questions Cog - Generate questions from PDF files

This cog provides the /questions command to generate exam questions based on uploaded PDF files.
Sends file and parameters to n8n webhook for processing.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
import io
from .base_cog import BaseCog, CogMetadata, CommandDefinition, CommandField


class QuestionsResponse(BaseModel):
    success: bool
    message: str
    webhook_response: Optional[dict] = None


class QuestionsCog(BaseCog):
    """
    Questions Generation Plugin
    
    Provides /questions command to generate exam questions from PDF files
    Supports various question types and difficulty levels
    """
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="Questions",
            description="Generate exam questions from PDF files",
            version="1.0.0",
            author="VKU Toolkit Team",
            icon="HelpCircle",
            color="from-pink-500 to-rose-500",
            commands=[
                CommandDefinition(
                    command="questions",
                    description="Generate exam questions from file (file required)",
                    fields=[
                        CommandField(
                            name="file",
                            label="Upload PDF File",
                            type="file",
                            placeholder="Select PDF file for question generation...",
                            required=True
                        ),
                        CommandField(
                            name="num_questions",
                            label="Number of Questions",
                            type="number",
                            placeholder="10",
                            required=True
                        ),
                        CommandField(
                            name="question_relevance",
                            label="Question Relevance to File",
                            type="select",
                            placeholder="Choose relevance level...",
                            required=True,
                            options=["Very High", "High", "Medium", "Low"]
                        ),
                        CommandField(
                            name="num_open_questions",
                            label="Number of Open-Ended Questions",
                            type="number",
                            placeholder="3",
                            required=True
                        ),
                        CommandField(
                            name="difficulty_level",
                            label="Difficulty Level of Open Questions",
                            type="select",
                            placeholder="Choose difficulty...",
                            required=True,
                            options=["Easy", "Medium", "Hard", "Very Hard"]
                        )
                    ]
                )
            ]
        )
        self.webhook_url = "https://n8n.group12.cloud/webhook-test/questions"
        self.command_history = []
        
    def setup(self):
        """Setup Questions webhook routes"""
        
        @self.router.get("/")
        async def get_info():
            """Get Questions cog information"""
            return {
                "name": self.metadata.name,
                "description": self.metadata.description,
                "enabled": self.is_enabled(),
                "webhook_url": self.webhook_url,
                "commands": [cmd.model_dump() for cmd in self.metadata.commands],
                "endpoints": {
                    "execute": "POST /execute - Generate questions from file",
                    "history": "GET /history - Get command history",
                    "test": "POST /test - Test webhook connectivity"
                },
                "supported_file_types": ["pdf"],
                "parameters": {
                    "num_questions": "Total number of questions to generate (1-100)",
                    "question_relevance": "How relevant questions should be to file content",
                    "num_open_questions": "Number of open-ended questions (essay/short answer)",
                    "difficulty_level": "Difficulty level for open-ended questions"
                },
                "usage": {
                    "command": "/questions",
                    "note": "File upload is REQUIRED for /questions command",
                    "example": {
                        "file": "course_material.pdf (REQUIRED)",
                        "num_questions": "10",
                        "question_relevance": "High",
                        "num_open_questions": "3",
                        "difficulty_level": "Medium"
                    }
                },
                "total_commands": len(self.command_history)
            }
        
        @self.router.post("/execute", response_model=QuestionsResponse)
        async def execute_command(request: Request):
            """
            Execute /questions command - Generate questions from PDF
            
            Returns:
            - success: Whether webhook was sent successfully
            - message: Status message
            - webhook_response: Response from n8n webhook
            """
            print("[Questions] Received execute request")
            
            # Initialize variables with defaults
            num_questions = "10"
            question_relevance = "High"
            num_open_questions = "0"
            difficulty_level = "Medium"
            auth_userid = "anonymous"
            file = None
            
            try:
                content_type = request.headers.get("content-type", "")
                print(f"[Questions] Content-Type: {content_type}")
                
                if "multipart/form-data" in content_type:
                    form = await request.form()
                    print(f"[Questions] Form keys: {list(form.keys())}")
                    
                    # Helper to safely get string value
                    def get_str(key, default):
                        val = form.get(key)
                        if val is None: return default
                        return str(val)

                    num_questions = get_str("num_questions", "10")
                    question_relevance = get_str("question_relevance", "High")
                    num_open_questions = get_str("num_open_questions", "0")
                    difficulty_level = get_str("difficulty_level", "Medium")
                    auth_userid = get_str("auth_userid", "anonymous")
                    file = form.get("file")
                    
                elif "application/json" in content_type:
                    try:
                        json_data = await request.json()
                        print(f"[Questions] JSON data: {json_data}")
                        
                        num_questions = str(json_data.get("num_questions", "10"))
                        question_relevance = str(json_data.get("question_relevance", "High"))
                        num_open_questions = str(json_data.get("num_open_questions", "0"))
                        difficulty_level = str(json_data.get("difficulty_level", "Medium"))
                        auth_userid = str(json_data.get("auth_userid", "anonymous"))
                    except Exception as e:
                        print(f"[Questions] Failed to parse JSON: {e}")
            except Exception as e:
                print(f"[Questions] Error parsing request: {e}")
                import traceback
                traceback.print_exc()

            print(f"[Questions] Parameters: num_questions={num_questions}, relevance={question_relevance}, open={num_open_questions}, difficulty={difficulty_level}")
            
            try:
                if not self.is_enabled():
                    print("[Questions] Cog is disabled")
                    raise HTTPException(
                        status_code=403,
                        detail="Questions cog is currently disabled"
                    )
                
                # Validate required fields with better error messages
                print(f"[Questions] Validating fields: num_questions='{num_questions}', relevance='{question_relevance}', open='{num_open_questions}', difficulty='{difficulty_level}'")
                
                # If any required field is missing, provide defaults instead of failing
                # Defaults: num_questions=10, question_relevance='High', num_open_questions=0, difficulty_level='Medium'
                if not num_questions or (isinstance(num_questions, str) and not num_questions.strip()):
                    print("[Questions] num_questions missing or empty - defaulting to 10")
                    num_questions = "10"
                
                if not question_relevance or (isinstance(question_relevance, str) and not question_relevance.strip()):
                    print("[Questions] question_relevance missing or empty - defaulting to 'High'")
                    question_relevance = "High"
                
                if not num_open_questions or (isinstance(num_open_questions, str) and not num_open_questions.strip()):
                    print("[Questions] num_open_questions missing or empty - defaulting to 0")
                    num_open_questions = "0"
                
                if not difficulty_level or (isinstance(difficulty_level, str) and not difficulty_level.strip()):
                    print("[Questions] difficulty_level missing or empty - defaulting to 'Medium'")
                    difficulty_level = "Medium"
                
                if not file:
                    raise HTTPException(
                        status_code=400,
                        detail="file is required"
                    )
                
                # Validate file extension
                if not file.filename:
                    raise HTTPException(
                        status_code=400,
                        detail="No file provided (file is REQUIRED)"
                    )
                
                # Check file extension
                if not file.filename.lower().endswith('.pdf'):
                    raise HTTPException(
                        status_code=400,
                        detail="Only PDF files are supported"
                    )
                
                # Read file content as binary
                file_content = await file.read()
                print(f"[Questions] File size: {len(file_content)} bytes")
                
                # Validate parameters
                try:
                    num_q = int(num_questions)
                    if num_q < 1 or num_q > 100:
                        raise ValueError("must be between 1 and 100")
                except ValueError as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid num_questions: {str(e)}"
                    )
                
                try:
                    num_open = int(num_open_questions)
                    if num_open < 0 or num_open > num_q:
                        raise ValueError(f"must be between 0 and {num_q}")
                except (ValueError, TypeError) as e:
                    # Parse the original error to get num_q value
                    error_msg = str(e)
                    if "invalid literal" in error_msg.lower():
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid num_open_questions: '{num_open_questions}' is not a valid number"
                        )
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid num_open_questions: {error_msg}"
                        )
                
                # Validate select fields
                valid_relevance = ["Very High", "High", "Medium", "Low"]
                if question_relevance not in valid_relevance:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid question_relevance. Must be one of: {', '.join(valid_relevance)}"
                    )
                
                valid_difficulty = ["Easy", "Medium", "Hard", "Very Hard"]
                if difficulty_level not in valid_difficulty:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid difficulty_level. Must be one of: {', '.join(valid_difficulty)}"
                    )
                
                # Prepare multipart payload
                print(f"[Questions] Sending to webhook: {self.webhook_url} with file")
                
                # Create multipart form data
                form_data = {
                    "num_questions": str(num_q),
                    "question_relevance": question_relevance,
                    "num_open_questions": str(num_open),
                    "difficulty_level": difficulty_level,
                    "auth_userid": auth_userid,
                    "timestamp": datetime.now().isoformat(),
                    "source": "VKU Toolkit - Questions",
                }
                
                # Add file as binary
                files = {
                    "file": (file.filename, io.BytesIO(file_content), "application/pdf")
                }
                
                print(f"[Questions] Payload: num_questions={num_q}, relevance={question_relevance}, open={num_open}, difficulty={difficulty_level}, file={file.filename}")
                
                # Send to n8n webhook with multipart form data
                async with httpx.AsyncClient(timeout=3600.0) as client:
                    response = await client.post(
                        self.webhook_url,
                        data=form_data,
                        files=files
                    )
                    
                    print(f"[Questions] Webhook response status: {response.status_code}")
                    
                    webhook_response = None
                    try:
                        response_data = response.json()
                        print(f"[Questions] Raw response type: {type(response_data)}")
                        
                        # Handle new response format: { "in_file_questions": [...], "external_questions": [...] }
                        if isinstance(response_data, dict):
                            questions_list = []
                            in_file_count = 0
                            external_count = 0
                            
                            # Check if response_data has the questions directly
                            if "in_file_questions" in response_data:
                                # Direct format from n8n
                                if "in_file_questions" in response_data:
                                    for q in response_data["in_file_questions"]:
                                        q["type"] = "in_file"
                                        questions_list.append(q)
                                    in_file_count = len(response_data["in_file_questions"])
                                
                                if "external_questions" in response_data:
                                    for q in response_data["external_questions"]:
                                        q["type"] = "external"
                                        questions_list.append(q)
                                    external_count = len(response_data["external_questions"])
                                
                                webhook_response = {
                                    "questions": questions_list,
                                    "total": len(questions_list),
                                    "in_file_count": in_file_count,
                                    "external_count": external_count
                                }
                            else:
                                # Fallback: keep original response
                                webhook_response = response_data
                        elif isinstance(response_data, list) and len(response_data) > 0:
                            # Handle array response (old format or wrapped)
                            first_item = response_data[0]
                            if isinstance(first_item, dict):
                                questions_list = []
                                in_file_count = 0
                                external_count = 0
                                
                                if "in_file_questions" in first_item:
                                    for q in first_item["in_file_questions"]:
                                        q["type"] = "in_file"
                                        questions_list.append(q)
                                    in_file_count = len(first_item["in_file_questions"])
                                
                                if "external_questions" in first_item:
                                    for q in first_item["external_questions"]:
                                        q["type"] = "external"
                                        questions_list.append(q)
                                    external_count = len(first_item["external_questions"])
                                
                                if questions_list:
                                    webhook_response = {
                                        "questions": questions_list,
                                        "total": len(questions_list),
                                        "in_file_count": in_file_count,
                                        "external_count": external_count
                                    }
                                else:
                                    webhook_response = first_item
                            else:
                                webhook_response = response_data[0]
                        else:
                            webhook_response = {"text": str(response_data)}
                    except Exception as parse_error:
                        print(f"[Questions] Error parsing webhook response: {str(parse_error)}")
                        import traceback
                        print(f"[Questions] Parse error traceback:\n{traceback.format_exc()}")
                        webhook_response = {"text": response.text[:200]}
                    
                    print(f"[Questions] Parsed webhook_response: {webhook_response}")
                    
                    # Log to history
                    self.command_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "user": auth_userid,
                        "file": file.filename,
                        "file_size": len(file_content),
                        "num_questions": num_q,
                        "relevance": question_relevance,
                        "open_questions": num_open,
                        "difficulty": difficulty_level,
                        "status_code": response.status_code,
                        "success": response.status_code == 200
                    })
                    
                    # Keep only last 100 entries
                    if len(self.command_history) > 100:
                        self.command_history = self.command_history[-100:]
                    
                    if response.status_code == 200:
                        return QuestionsResponse(
                            success=True,
                            message=f"Generated {num_q} questions from '{file.filename}' successfully",
                            webhook_response=webhook_response
                        )
                    else:
                        return QuestionsResponse(
                            success=False,
                            message=f"Failed to generate questions (status {response.status_code})",
                            webhook_response=webhook_response
                        )
                        
            except httpx.TimeoutException:
                print("[Questions] Webhook timeout")
                raise HTTPException(
                    status_code=504,
                    detail="Question generation request timed out (Webhook not responding)"
                )
            except httpx.ConnectError as e:
                print(f"[Questions] Webhook connection failed: {str(e)}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to connect to webhook (Is n8n running?): {str(e)}"
                )
            except httpx.RequestError as e:
                print(f"[Questions] Webhook request error: {str(e)}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to send webhook: {str(e)}"
                )
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"[Questions] Unexpected error: {str(e)}")
                print(f"[Questions] Traceback:\n{error_trace}")
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
            Test /questions command with sample file
            
            Note: This is a test endpoint that generates a sample PDF for testing
            """
            if not self.is_enabled():
                raise HTTPException(
                    status_code=403,
                    detail="Questions cog is currently disabled"
                )
            
            # Create test PDF content
            test_pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF for Question Generation) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000303 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
397
%%EOF"""
            
            print("[Questions] Test command initiated")
            
            try:
                # Prepare multipart form data with test file
                form_data = {
                    "num_questions": (None, "5"),
                    "question_relevance": (None, "High"),
                    "num_open_questions": (None, "2"),
                    "difficulty_level": (None, "Medium"),
                    "auth_userid": (None, "test_user_123"),
                    "timestamp": (None, datetime.now().isoformat()),
                    "source": (None, "VKU Toolkit - Questions - TEST"),
                }
                
                files = {
                    "file": ("test_document.pdf", io.BytesIO(test_pdf_content), "application/pdf")
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
                        
                        # Handle new response format: { "in_file_questions": [...], "external_questions": [...] }
                        if isinstance(response_data, dict):
                            questions_list = []
                            in_file_count = 0
                            external_count = 0
                            
                            # Check if response_data has the questions directly
                            if "in_file_questions" in response_data:
                                # Direct format from n8n
                                if "in_file_questions" in response_data:
                                    for q in response_data["in_file_questions"]:
                                        q["type"] = "in_file"
                                        questions_list.append(q)
                                    in_file_count = len(response_data["in_file_questions"])
                                
                                if "external_questions" in response_data:
                                    for q in response_data["external_questions"]:
                                        q["type"] = "external"
                                        questions_list.append(q)
                                    external_count = len(response_data["external_questions"])
                                
                                webhook_response = {
                                    "questions": questions_list,
                                    "total": len(questions_list),
                                    "in_file_count": in_file_count,
                                    "external_count": external_count
                                }
                            else:
                                # Fallback: keep original response
                                webhook_response = response_data
                        elif isinstance(response_data, list) and len(response_data) > 0:
                            # Handle array response (old format or wrapped)
                            first_item = response_data[0]
                            if isinstance(first_item, dict):
                                questions_list = []
                                in_file_count = 0
                                external_count = 0
                                
                                if "in_file_questions" in first_item:
                                    for q in first_item["in_file_questions"]:
                                        q["type"] = "in_file"
                                        questions_list.append(q)
                                    in_file_count = len(first_item["in_file_questions"])
                                
                                if "external_questions" in first_item:
                                    for q in first_item["external_questions"]:
                                        q["type"] = "external"
                                        questions_list.append(q)
                                    external_count = len(first_item["external_questions"])
                                
                                if questions_list:
                                    webhook_response = {
                                        "questions": questions_list,
                                        "total": len(questions_list),
                                        "in_file_count": in_file_count,
                                        "external_count": external_count
                                    }
                                else:
                                    webhook_response = first_item
                            else:
                                webhook_response = response_data[0]
                        else:
                            webhook_response = {"text": str(response_data)}
                    except Exception as parse_error:
                        print(f"[Questions] Error parsing webhook response: {str(parse_error)}")
                        import traceback
                        print(f"[Questions] Parse error traceback:\n{traceback.format_exc()}")
                        webhook_response = {"text": response.text[:200]}
                    
                    return QuestionsResponse(
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
    cog = QuestionsCog(app)
    cog.setup()
    cog.register_routes()
    return cog
