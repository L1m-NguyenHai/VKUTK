"""
Cogs Package - Plugin System for VKU Toolkit

Cogs are modular plugins that can be loaded dynamically into the FastAPI application.
Each cog should inherit from BaseCog and implement required methods.

Structure:
- Each cog is a separate Python file in this directory
- Cogs are auto-loaded by main.py
- Each cog can register its own routes, dependencies, and configurations
"""

from .base_cog import BaseCog, CogMetadata

__all__ = ["BaseCog", "CogMetadata"]
