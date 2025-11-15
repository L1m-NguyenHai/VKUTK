"""
Helper để extract và validate user_id từ access token
"""

from typing import Optional
from fastapi import HTTPException, Header
from Supabase import auth_repo


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user_id from Authorization header
    
    Args:
        authorization: "Bearer <access_token>"
    
    Returns:
        user_id (UUID string)
    
    Raises:
        HTTPException: Nếu token invalid hoặc không có
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    access_token = parts[1]
    
    # Get user from token
    result = auth_repo.get_user(access_token)
    
    if not result.get("success") or not result.get("user"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return result["user"]["id"]
