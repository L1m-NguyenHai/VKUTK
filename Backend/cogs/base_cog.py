"""
Base Cog Class - Foundation for all VKU Toolkit plugins

Every cog should inherit from BaseCog and implement the setup method.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from fastapi import FastAPI, APIRouter
from datetime import datetime


class CommandField(BaseModel):
    """Field definition for a command"""
    name: str
    label: str
    type: str = "text"  # text, textarea, select, number
    placeholder: Optional[str] = None
    required: bool = True
    options: Optional[List[str]] = None  # For select type


class CommandDefinition(BaseModel):
    """Definition for a slash command"""
    command: str  # e.g., "sto"
    description: str
    fields: List[CommandField]


class CogMetadata(BaseModel):
    """Metadata for each cog/plugin"""
    name: str
    description: str
    version: str
    author: str
    enabled: bool = True
    dependencies: List[str] = []
    icon: Optional[str] = None  # Lucide icon name
    color: Optional[str] = None  # Gradient color classes
    commands: List[CommandDefinition] = []  # Slash commands this cog provides


class BaseCog(ABC):
    """
    Base class for all cogs (plugins)
    
    Usage:
    ```python
    from cogs.base_cog import BaseCog, CogMetadata
    
    class MyCog(BaseCog):
        def __init__(self, app: FastAPI):
            super().__init__(app)
            self.metadata = CogMetadata(
                name="My Plugin",
                description="Description here",
                version="1.0.0",
                author="Your Name"
            )
        
        def setup(self):
            # Register routes here
            @self.router.get("/my-endpoint")
            async def my_endpoint():
                return {"message": "Hello"}
    ```
    """
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.router = APIRouter()
        self.metadata = CogMetadata(
            name="Base Cog",
            description="Base cog class",
            version="0.0.1",
            author="System"
        )
        self.loaded_at = datetime.now()
        self._enabled = True
        
    @abstractmethod
    def setup(self):
        """
        Setup method called during cog initialization.
        Register your routes, dependencies, and configurations here.
        """
        pass
    
    def register_routes(self):
        """Register this cog's router with the main app"""
        if self.router.routes:
            self.app.include_router(
                self.router,
                prefix=f"/api/plugins/{self.get_cog_id()}",
                tags=[self.metadata.name]
            )
    
    def get_cog_id(self) -> str:
        """Get unique identifier for this cog"""
        return self.__class__.__name__.lower().replace("cog", "")
    
    def get_info(self) -> Dict[str, Any]:
        """Get cog information"""
        # Sync metadata.enabled with _enabled before returning
        self.metadata.enabled = self._enabled
        return {
            "id": self.get_cog_id(),
            "metadata": self.metadata.model_dump(),
            "loaded_at": self.loaded_at.isoformat(),
            "routes_count": len(self.router.routes),
            "enabled": self._enabled
        }
    
    def enable(self):
        """Enable this cog"""
        self._enabled = True
        self.metadata.enabled = True
    
    def disable(self):
        """Disable this cog"""
        self._enabled = False
        self.metadata.enabled = False
    
    def is_enabled(self) -> bool:
        """Check if cog is enabled"""
        return self._enabled
    
    def cleanup(self):
        """
        Cleanup method called when cog is unloaded.
        Override this to cleanup resources.
        """
        pass
