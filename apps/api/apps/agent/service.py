"""
Agent service for handling the integration between chat module and agent tools.

This service provides a clean interface for the chat module to interact with agent tools
without needing to know the implementation details.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

from .llm_parser import LLMAgentParser
from .tools import registry
from .utils.formatter import ToolResultFormatter

logger = logging.getLogger(__name__)


class AgentService:
    """
    Service for handling agent tool operations including parsing queries,
    executing tools, and formatting results for chat integration.
    """
    
    def __init__(self):
        """Initialize the agent service."""
        self._parser = LLMAgentParser()
    
    def handle_chat_query(self, content: str, system_prompt: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Process a user chat query to determine if it can be handled by agent tools.
        
        Args:
            content: The user query content
            system_prompt: Optional system prompt (for context)
            
        Returns:
            Tuple of (is_agent_query, response_content)
        """
        try:
            # Parse the query to identify potential tools
            matches = self._parser.parse_query(content)
            
            # If no matches or low confidence, return False
            if not matches or matches[0]["score"] < 0.5:
                logger.info("No high-confidence tool matches found for query")
                return False, None
            
            # Get the highest-scoring tool match
            best_match = matches[0]
            tool_name = best_match["tool"]
            params = best_match.get("params", {})
            
            # Log the selected tool and confidence
            logger.info(f"Selected tool: {tool_name} with confidence {best_match['score']:.2f}")
            if params:
                logger.info(f"Tool parameters: {params}")
            
            # Execute the tool
            success, response = self._execute_tool(tool_name, params)
            return success, response
            
        except Exception as e:
            logger.error(f"Error handling chat query: {e}", exc_info=True)
            return False, None
    
    def _execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Execute a tool with the given parameters.
        
        Args:
            tool_name: The name of the tool to execute
            params: Parameters to pass to the tool
            
        Returns:
            Tuple of (success, formatted_result_or_error)
        """
        tool = registry.get_tool(tool_name)
        if not tool:
            return False, None
            
        try:
            # Execute the tool asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(tool.execute(**params))
            loop.close()
            
            if result.success:
                # Format the result
                formatted_result = ToolResultFormatter.format_result(tool_name, result)
                return True, formatted_result
            else:
                # Return error message
                error_message = f"I tried to use the {tool_name.replace('_', ' ')} tool, but encountered an error: {result.error_message}"
                return True, error_message
                
        except Exception as e:
            # Handle any unexpected errors
            error_message = f"I tried to use the {tool_name.replace('_', ' ')} tool, but encountered an unexpected error: {str(e)}"
            logger.error(f"Error executing tool {tool_name}: {str(e)}", exc_info=True)
            return True, error_message
    
    def parse_query(self, query: str) -> List[Dict[str, Any]]:
        """
        Parse a query to identify potential tool matches.
        
        Args:
            query: The user query
            
        Returns:
            List of potential tool matches with scores and parameters
        """
        return self._parser.parse_query(query)
    
    def execute_tool_by_name(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific tool by name with parameters.
        
        Args:
            tool_name: Name of the tool to execute
            params: Parameters to pass to the tool
            
        Returns:
            Dictionary containing the execution result
        """
        tool = registry.get_tool(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not found"
            }
            
        try:
            # Execute the tool asynchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(tool.execute(**params))
            loop.close()
            
            # Format the response
            formatted_result = None
            if result.success:
                formatted_result = ToolResultFormatter.format_result(tool_name, result)
            
            return {
                "tool": tool_name,
                "success": result.success,
                "data": result.data,
                "error_message": result.error_message,
                "formatted_result": formatted_result,
            }
            
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}", exc_info=True)
            return {
                "tool": tool_name,
                "success": False,
                "error_message": f"Error executing tool: {str(e)}",
            } 