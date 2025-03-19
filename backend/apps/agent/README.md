# Agent Tools System for Elf AI

This module provides a comprehensive framework for integrating external tools and services
with the Elf AI chat system. It allows the AI to identify when a user request requires a
specific tool and execute the appropriate action.

## Architecture

The agent tools system is organized into several key components:

### 1. Service Layer

- `AgentService`: The main entry point for other modules. Provides a clean interface for the chat module to interact with agent tools.

### 2. Tool Framework

- `BaseTool`: Abstract base class that all tools must inherit from
- `ToolParameter`: Defines parameters for tools with type validation
- `ToolResult`: Standardized result format for all tool executions
- `ToolRegistry`: Central registry that manages all available tools

### 3. Natural Language Understanding

- `AgentToolParser`: Analyzes user queries to identify relevant tools
- Pattern matching and keyword scoring for tool selection
- Parameter extraction from natural language

### 4. Response Formatting

- `ToolResultFormatter`: Converts tool results into user-friendly messages
- Specialized formatters for different tool types
- Consistent markdown formatting with emojis

### 5. API Endpoints

- `tools/`: List available tools and their schemas
- `tools/<tool_name>/`: Get schema for a specific tool
- `parse/`: Analyze user queries for tool matching
- `execute/`: Execute tools with parameters

## Adding New Tools

### Creating a New Tool Category

1. Create a new directory under `apps/api/apps/agent/tools/`
2. Add an `__init__.py` file with category documentation
3. Implement tool classes in separate Python files

### Implementing a New Tool

1. Create a new Python file in a category directory
2. Implement a class that inherits from `BaseTool`
3. Define required class variables: `name`, `description`, `category`, `parameters`
4. Implement the `execute` method
5. Use the `@register_tool` decorator to register the tool

Example:

```python
from apps.agent.tools.base import BaseTool, ToolParameter, ToolParameterType, ToolResult
from apps.agent.tools.registry import register_tool

@register_tool
class MyTool(BaseTool):
    """Tool documentation."""

    name = "my_tool"
    description = "Description of what the tool does"
    category = "my_category"

    parameters = [
        ToolParameter(
            name="param1",
            type=ToolParameterType.STRING,
            description="Description of parameter",
            required=True,
        ),
    ]

    async def execute(self, **kwargs) -> ToolResult:
        # Implementation goes here
        return ToolResult(success=True, data={"result": "value"})
```

### Improving Tool Detection

To improve the detection of your new tool, update the parser patterns in `parser.py`:

1. Add patterns for the category in `category_patterns`
2. Add patterns for the specific tool in `tool_patterns`
3. Add parameter extraction logic in `_extract_parameters`

## Integration with Chat System

The agent tools system is integrated with the chat module through the `AgentService`.
When a user sends a message, the chat module calls `agent_service.handle_chat_query()`
to determine if the query can be handled by a tool. If so, the tool is executed and
the result is formatted and returned to the user.

## Running Tests

Tests for the agent tools system can be run with:

```bash
python manage.py test apps.agent
```
