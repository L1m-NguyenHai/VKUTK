"""
Supabase Authentication Module
Handles user authentication: sign up, sign in, sign out, session management
"""

from typing import Optional, Dict, Any
from supabase import Client
from .client import supabase_client
import traceback


class AuthRepository:
    """Repository for authentication operations"""
    
    def __init__(self):
        self.client: Client = supabase_client.get_client()
    
    def sign_up(self, email: str, password: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Register a new user
        
        Args:
            email: User's email
            password: User's password (min 6 characters)
            metadata: Optional user metadata (name, phone, etc.)
        
        Returns:
            {
                "success": True/False,
                "user": {...},
                "session": {...},
                "message": "..."
            }
        """
        try:
            data = {
                "email": email,
                "password": password,
            }
            
            if metadata:
                data["options"] = {"data": metadata}
            
            response = self.client.auth.sign_up(data)
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "email_confirmed": response.user.email_confirmed_at is not None,
                        "created_at": str(response.user.created_at),
                        "metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token if response.session else None,
                        "refresh_token": response.session.refresh_token if response.session else None,
                        "expires_at": response.session.expires_at if response.session else None
                    } if response.session else None,
                    "message": "Sign up successful. Please check your email to confirm." if not response.session else "Sign up successful."
                }
            else:
                return {
                    "success": False,
                    "message": "Sign up failed"
                }
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Sign up error: {error_msg}")
            traceback.print_exc()
            return {
                "success": False,
                "message": f"Sign up failed: {error_msg}"
            }
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in existing user
        
        Args:
            email: User's email
            password: User's password
        
        Returns:
            {
                "success": True/False,
                "user": {...},
                "session": {...},
                "message": "..."
            }
        """
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "email_confirmed": response.user.email_confirmed_at is not None,
                        "created_at": str(response.user.created_at),
                        "metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at,
                        "token_type": response.session.token_type
                    },
                    "message": "Sign in successful"
                }
            else:
                return {
                    "success": False,
                    "message": "Invalid credentials"
                }
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Sign in error: {error_msg}")
            return {
                "success": False,
                "message": f"Sign in failed: {error_msg}"
            }
    
    def sign_out(self, access_token: str) -> Dict[str, Any]:
        """
        Sign out user
        
        Args:
            access_token: User's access token
        
        Returns:
            {
                "success": True/False,
                "message": "..."
            }
        """
        try:
            # Set the session before signing out
            self.client.auth.set_session(access_token, access_token)
            self.client.auth.sign_out()
            
            return {
                "success": True,
                "message": "Sign out successful"
            }
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Sign out error: {error_msg}")
            return {
                "success": False,
                "message": f"Sign out failed: {error_msg}"
            }
    
    def get_user(self, access_token: str) -> Dict[str, Any]:
        """
        Get current user from access token
        
        Args:
            access_token: User's access token
        
        Returns:
            {
                "success": True/False,
                "user": {...},
                "message": "..."
            }
        """
        try:
            # Set the session
            self.client.auth.set_session(access_token, access_token)
            user = self.client.auth.get_user()
            
            if user:
                return {
                    "success": True,
                    "user": {
                        "id": user.user.id,
                        "email": user.user.email,
                        "email_confirmed": user.user.email_confirmed_at is not None,
                        "created_at": str(user.user.created_at),
                        "metadata": user.user.user_metadata
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "User not found"
                }
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Get user error: {error_msg}")
            return {
                "success": False,
                "message": f"Failed to get user: {error_msg}"
            }
    
    def refresh_session(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: User's refresh token
        
        Returns:
            {
                "success": True/False,
                "session": {...},
                "message": "..."
            }
        """
        try:
            response = self.client.auth.refresh_session(refresh_token)
            
            if response.session:
                return {
                    "success": True,
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_at": response.session.expires_at,
                        "token_type": response.session.token_type
                    },
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata
                    } if response.user else None,
                    "message": "Session refreshed"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to refresh session"
                }
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Refresh session error: {error_msg}")
            return {
                "success": False,
                "message": f"Failed to refresh session: {error_msg}"
            }
    
    def reset_password_email(self, email: str) -> Dict[str, Any]:
        """
        Send password reset email
        
        Args:
            email: User's email
        
        Returns:
            {
                "success": True/False,
                "message": "..."
            }
        """
        try:
            self.client.auth.reset_password_email(email)
            return {
                "success": True,
                "message": "Password reset email sent"
            }
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Reset password error: {error_msg}")
            return {
                "success": False,
                "message": f"Failed to send reset email: {error_msg}"
            }
    
    def update_user(self, access_token: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user information
        
        Args:
            access_token: User's access token
            updates: Dictionary with fields to update (email, password, metadata)
        
        Returns:
            {
                "success": True/False,
                "user": {...},
                "message": "..."
            }
        """
        try:
            # Set the session
            self.client.auth.set_session(access_token, access_token)
            
            response = self.client.auth.update_user(updates)
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "metadata": response.user.user_metadata
                    },
                    "message": "User updated successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to update user"
                }
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Update user error: {error_msg}")
            return {
                "success": False,
                "message": f"Failed to update user: {error_msg}"
            }


# Global instance
auth_repo = AuthRepository()
