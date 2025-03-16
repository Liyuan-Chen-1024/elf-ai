"""
Tool registry implementation.
"""

import importlib
import inspect
import os
import pkgutil
from typing import List, Optional, Type

from .base import BaseTool, ToolRegistry

# Global registry instance
registry = ToolRegistry()


def initialize() -> None:
    """
    Initialize the tool registry by discovering and registering all tools.
    """
    # Import all tool modules to register them
    discover_tools()


def discover_tools() -> None:
    """
    Discover and load all tool modules.
    
    This automatically imports all Python modules in the tools directory
    to register any tool classes through the registry decorator.
    """
    # Get the current package path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get all subdirectories (categories)
    for item in os.listdir(current_dir):
        if os.path.isdir(os.path.join(current_dir, item)) and not item.startswith('_'):
            # Import all modules in the category
            category_path = os.path.join(current_dir, item)
            package_name = f"apps.agent.tools.{item}"
            
            try:
                # Import the category package
                importlib.import_module(package_name)
                
                # Import all modules in the category
                for _, name, _ in pkgutil.iter_modules([category_path]):
                    try:
                        importlib.import_module(f"{package_name}.{name}")
                    except Exception as e:
                        print(f"Error importing tool module {package_name}.{name}: {e}")
            except Exception as e:
                print(f"Error importing tool category {package_name}: {e}")


def register_tool(cls: Type[BaseTool]) -> Type[BaseTool]:
    """
    Decorator to register a tool class with the registry.
    
    Example:
        @register_tool
        class MyTool(BaseTool):
            ...
    
    Args:
        cls: The tool class to register
        
    Returns:
        The same class, unchanged
    """
    registry.register(cls)
    return cls 