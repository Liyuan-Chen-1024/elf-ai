"""
Base classes and interfaces for agent tools.
"""

import abc
import enum
import inspect
import json
from dataclasses import dataclass
from typing import Any, ClassVar, Dict, List, Optional, Type


class ToolParameterType(enum.Enum):
    """Enum for parameter types."""

    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"


@dataclass
class ToolParameter:
    """
    Definition of a parameter for a tool.
    """

    name: str
    type: ToolParameterType
    description: str
    required: bool = True
    default: Optional[Any] = None
    enum: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = {
            "name": self.name,
            "type": self.type.value,
            "description": self.description,
            "required": self.required,
        }

        if self.default is not None:
            result["default"] = self.default

        if self.enum is not None:
            result["enum"] = self.enum

        return result


@dataclass
class ToolResult:
    """
    Result returned from a tool execution.
    """

    success: bool
    data: Any = None
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = {
            "success": self.success,
        }

        if self.data is not None:
            if hasattr(self.data, "to_dict"):
                result["data"] = self.data.to_dict()
            else:
                result["data"] = self.data

        if self.error_message:
            result["error_message"] = self.error_message

        return result

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())


class BaseTool(abc.ABC):
    """
    Base class for all agent tools.

    Every tool should inherit from this class and implement required methods.
    """

    # Class variables that should be overridden by subclasses
    name: ClassVar[str]
    description: ClassVar[str]
    category: ClassVar[str]
    parameters: ClassVar[List[ToolParameter]] = []
    examples: ClassVar[List[str]] = []

    # New fields for LLM-based parsing
    patterns: ClassVar[List[str]] = []  # Example patterns that should trigger this tool
    keywords: ClassVar[List[str]] = []  # Important keywords related to this tool
    input_format: ClassVar[str] = ""  # Description of expected input format
    output_format: ClassVar[str] = ""  # Description of the output format
    use_cases: ClassVar[List[str]] = []  # Specific use cases for this tool

    def __init__(self):
        """Initialize the tool."""
        # Verify that required class attributes are set
        if not hasattr(self, "name") or not self.name:
            raise ValueError(
                f"Tool {self.__class__.__name__} must define a 'name' class variable"
            )

        if not hasattr(self, "description") or not self.description:
            raise ValueError(
                f"Tool {self.__class__.__name__} must define a 'description' class variable"
            )

        if not hasattr(self, "category") or not self.category:
            raise ValueError(
                f"Tool {self.__class__.__name__} must define a 'category' class variable"
            )

    def get_schema(self) -> Dict[str, Any]:
        """
        Get a complete schema description of this tool for LLM-based parsing.

        Returns:
            Dict with all information about the tool that would help an LLM understand when to use it
        """
        schema = {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "parameters": [p.to_dict() for p in self.parameters],
            "examples": self.examples,
        }

        # Add optional fields if they have values
        if hasattr(self, "patterns") and self.patterns:
            schema["patterns"] = self.patterns

        if hasattr(self, "keywords") and self.keywords:
            schema["keywords"] = self.keywords

        if hasattr(self, "input_format") and self.input_format:
            schema["input_format"] = self.input_format

        if hasattr(self, "output_format") and self.output_format:
            schema["output_format"] = self.output_format

        if hasattr(self, "use_cases") and self.use_cases:
            schema["use_cases"] = self.use_cases

        return schema

    @abc.abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with the given parameters.

        Args:
            **kwargs: Tool-specific parameters

        Returns:
            ToolResult: The result of executing the tool
        """
        pass


class ToolRegistry:
    """
    Registry for all available tools.
    """

    def __init__(self):
        self._tools: Dict[str, Type[BaseTool]] = {}
        self._instances: Dict[str, BaseTool] = {}
        self._categories: Dict[str, List[str]] = {}

    def register(self, tool_class: Type[BaseTool]) -> None:
        """
        Register a tool class.

        Args:
            tool_class: The tool class to register
        """
        if not inspect.isclass(tool_class) or not issubclass(tool_class, BaseTool):
            raise ValueError(f"Tool must be a subclass of BaseTool, got {tool_class}")

        # Create an instance to verify it's correctly implemented
        instance = tool_class()
        tool_name = instance.name
        category = instance.category

        if tool_name in self._tools:
            raise ValueError(f"Tool with name '{tool_name}' is already registered")

        self._tools[tool_name] = tool_class
        self._instances[tool_name] = instance

        if category not in self._categories:
            self._categories[category] = []

        self._categories[category].append(tool_name)

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """
        Get a tool instance by name.

        Args:
            name: Tool name

        Returns:
            BaseTool or None: The tool instance if found, None otherwise
        """
        return self._instances.get(name)

    def get_all_tools(self) -> List[BaseTool]:
        """
        Get all registered tool instances.

        Returns:
            List[BaseTool]: List of all tool instances
        """
        return list(self._instances.values())

    def get_tools_by_category(self, category: str) -> List[BaseTool]:
        """
        Get all tools in a specific category.

        Args:
            category: The category to filter by

        Returns:
            List[BaseTool]: List of tool instances in the category
        """
        if category not in self._categories:
            return []

        return [self._instances[name] for name in self._categories[category]]

    def get_all_categories(self) -> List[str]:
        """
        Get all registered categories.

        Returns:
            List[str]: List of all categories
        """
        return list(self._categories.keys())

    def get_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema representation of all tools.

        Returns:
            Dict[str, Any]: JSON schema for all tools
        """
        return {
            "tools": [tool.get_schema() for tool in self._instances.values()],
            "categories": {
                category: [self._instances[name].get_schema() for name in tool_names]
                for category, tool_names in self._categories.items()
            },
        }
