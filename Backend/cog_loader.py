"""
Cog Loader - Automatic plugin loading system

This module handles dynamic loading of all cogs from the cogs directory.
"""

import os
import importlib
import inspect
from pathlib import Path
from typing import List, Dict, Any
from fastapi import FastAPI


class CogLoader:
    """Loads and manages cogs (plugins)"""
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.loaded_cogs: Dict[str, Any] = {}
        self.cogs_dir = Path(__file__).parent / "cogs"
        
    def load_all_cogs(self) -> List[str]:
        """
        Load all cogs from the cogs directory
        Returns list of loaded cog names
        """
        loaded = []
        
        if not self.cogs_dir.exists():
            print(f"⚠️  Cogs directory not found: {self.cogs_dir}")
            return loaded
        
        print(f"\n🔌 Loading cogs from: {self.cogs_dir}")
        
        # Find all Python files in cogs directory
        for file in self.cogs_dir.glob("*.py"):
            if file.name.startswith("_") or file.name == "base_cog.py":
                continue
            
            cog_name = file.stem
            try:
                # Import the cog module
                module_path = f"cogs.{cog_name}"
                module = importlib.import_module(module_path)
                
                # Look for setup function
                if hasattr(module, "setup"):
                    cog_instance = module.setup(self.app)
                    self.loaded_cogs[cog_name] = cog_instance
                    
                    # Get metadata if available
                    metadata = getattr(cog_instance, "metadata", None)
                    if metadata:
                        print(f"  ✅ Loaded: {metadata.name} v{metadata.version} by {metadata.author}")
                    # Print route paths registered in cog for easy debugging
                    try:
                        routes = [route.path for route in cog_instance.router.routes]
                        if routes:
                            print(f"     Routes: {routes}")
                    except Exception:
                        pass
                    else:
                        print(f"  ✅ Loaded: {cog_name}")
                    
                    loaded.append(cog_name)
                else:
                    print(f"  ⚠️  Skipped {cog_name}: No setup() function found")
                    
            except Exception as e:
                print(f"  ❌ Failed to load {cog_name}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        print(f"\n✨ Total cogs loaded: {len(loaded)}\n")
        return loaded
    
    def get_loaded_cogs(self) -> List[Dict[str, Any]]:
        """Get information about all loaded cogs"""
        result = []
        for cog_name, cog_instance in self.loaded_cogs.items():
            try:
                info = cog_instance.get_info()
                result.append(info)
            except Exception as e:
                result.append({
                    "id": cog_name,
                    "error": str(e)
                })
        return result
    
    def enable_cog(self, cog_name: str) -> bool:
        """Enable a specific cog"""
        if cog_name in self.loaded_cogs:
            try:
                self.loaded_cogs[cog_name].enable()
                print(f"✅ Enabled cog: {cog_name}")
                return True
            except Exception as e:
                print(f"❌ Failed to enable {cog_name}: {str(e)}")
                return False
        return False
    
    def disable_cog(self, cog_name: str) -> bool:
        """Disable a specific cog"""
        if cog_name in self.loaded_cogs:
            try:
                self.loaded_cogs[cog_name].disable()
                print(f"⏸️  Disabled cog: {cog_name}")
                return True
            except Exception as e:
                print(f"❌ Failed to disable {cog_name}: {str(e)}")
                return False
        return False
    
    def unload_cog(self, cog_name: str) -> bool:
        """Unload a specific cog"""
        if cog_name in self.loaded_cogs:
            try:
                cog = self.loaded_cogs[cog_name]
                if hasattr(cog, "cleanup"):
                    cog.cleanup()
                del self.loaded_cogs[cog_name]
                print(f"🔌 Unloaded cog: {cog_name}")
                return True
            except Exception as e:
                print(f"❌ Failed to unload {cog_name}: {str(e)}")
                return False
        return False
    
    def reload_cog(self, cog_name: str) -> bool:
        """Reload a specific cog"""
        self.unload_cog(cog_name)
        # Re-import and load
        try:
            module_path = f"cogs.{cog_name}"
            module = importlib.reload(importlib.import_module(module_path))
            if hasattr(module, "setup"):
                cog_instance = module.setup(self.app)
                self.loaded_cogs[cog_name] = cog_instance
                print(f"🔄 Reloaded cog: {cog_name}")
                return True
        except Exception as e:
            print(f"❌ Failed to reload {cog_name}: {str(e)}")
            return False
        return False
