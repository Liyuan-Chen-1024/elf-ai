"""
LLM-based parser for agent tools.

This module provides functionality to use LLM to parse user queries
and identify the most appropriate agent tools to handle them.
"""

import json
import re
import traceback
from typing import Any, Dict, List

from django.conf import settings

import requests

from apps.core.logging import get_logger

from .tools import registry
from .tools.base import BaseTool, ToolParameterType

logger = get_logger(__name__)


class LLMAgentParser:
    """
    Parser that uses LLM to match user intents to agent tools.

    This class leverages an LLM to identify which tools might handle
    a given user request and extract parameters from the request.
    """

    def __init__(self):
        """Initialize the LLM parser."""
        self.tools = registry.get_all_tools()
        self.categories = registry.get_all_categories()

    def parse_query(self, query: str) -> List[Dict[str, Any]]:
        """
        Parse a user query using LLM and return potential matching tools.

        Args:
            query: The user query string

        Returns:
            List of dictionaries with tool information and confidence scores
        """
        # Generate a tool selection prompt
        prompt = self._generate_tool_selection_prompt(query)

        try:
            # Call the LLM to select appropriate tools
            selected_tools = self._call_llm_for_tool_selection(prompt)

            # If no tools were selected, return empty list
            if not selected_tools:
                logger.info(f"No tools selected for query: {query}")
                return []

            # For each selected tool, extract parameters
            results = []
            for tool_info in selected_tools:
                tool_name = tool_info.get("tool")
                confidence = tool_info.get("confidence", 0.0)
                reasoning = tool_info.get("reasoning", "")

                # Skip if no tool name or very low confidence
                if not tool_name or confidence < 0.4:
                    continue

                # Get the tool instance
                tool = registry.get_tool(tool_name)
                if not tool:
                    logger.warning(f"Tool '{tool_name}' not found in registry")
                    continue

                # Log the selection with reasoning
                logger.info(
                    f"Tool selected: {tool_name} (confidence: {confidence}) - {reasoning}"
                )

                # Extract parameters for this tool
                params = self._extract_parameters(tool, query)

                results.append(
                    {
                        "tool": tool_name,
                        "score": confidence,
                        "category": tool.category,
                        "description": tool.description,
                        "params": params,
                        "reasoning": reasoning,
                    }
                )

            # Sort by confidence score
            results.sort(key=lambda x: x["score"], reverse=True)
            return results

        except Exception as e:
            logger.error(f"Error parsing query with LLM: {e}")
            logger.error(traceback.format_exc())

            # Return an empty list on error
            return []

    def _generate_tool_selection_prompt(self, query: str) -> str:
        """
        Generate a prompt for the LLM to select appropriate tools.

        Args:
            query: The user query

        Returns:
            A formatted prompt string
        """
        # Create a list of tool schemas
        tool_schemas = []
        for tool in self.tools:
            tool_schemas.append(tool.get_schema())

        # Format the prompt with detailed context
        prompt = f"""You are an AI assistant that helps select the appropriate tool to handle a user's request.
You will be given a list of available tools and a user query. Your task is to:
1. Determine which tool(s) would be most appropriate for handling the query
2. Rank them by confidence (0.0 to 1.0) where 1.0 means absolute certainty that this tool should be used
3. Return your analysis in a properly formatted JSON

Here are the available tools:
{json.dumps(tool_schemas, indent=2)}

When selecting a tool, consider:
- The specific intent expressed in the user's query
- How closely the query matches the examples and patterns for each tool
- Whether the query contains keywords associated with the tool
- If the query matches one of the tool's use cases

User query: "{query}"

You must respond with a JSON array containing tool suggestions. Each suggestion should have the following format:
{{
  "tool": "tool_name",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this tool is appropriate"
}}

If none of the tools are appropriate, return an empty array.
Only include tools with confidence > 0.4.
Response:"""

        return prompt

    def _call_llm_for_tool_selection(self, prompt: str) -> List[Dict[str, Any]]:
        """
        Call the LLM to select appropriate tools.

        Args:
            prompt: The formatted prompt

        Returns:
            List of tool selection results
        """
        url = settings.LLM_API_URL

        # Define the payload for the API
        payload = {
            "model": settings.LLM_MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.1,  # Lower temperature for more deterministic results
            "max_tokens": 1000,  # Ensure we get a complete response
        }

        try:
            # Make the API call
            response = requests.post(url, json=payload, timeout=10)  # Reduced timeout

            if response.status_code == 200:
                result = response.json()
                llm_response = result.get("response", "[]")

                # Log the raw response for debugging
                logger.debug(f"LLM raw response: {llm_response}")

                # Extract just the JSON part from the response
                json_pattern = r"\[.*\]"
                json_match = re.search(json_pattern, llm_response, re.DOTALL)

                if json_match:
                    try:
                        json_data = json.loads(json_match.group(0))
                        return json_data
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing JSON from LLM response: {e}")
                        logger.error(f"Response content: {llm_response}")
                        return []
                else:
                    logger.error(f"No JSON array found in LLM response: {llm_response}")
                    return []
            else:
                logger.error(
                    f"Error calling LLM API: {response.status_code} - {response.text}"
                )
                return []

        except requests.RequestException as e:
            logger.error(f"Request exception calling LLM API: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected exception calling LLM API: {e}")
            logger.error(traceback.format_exc())
            return []

    def _extract_parameters(self, tool: BaseTool, query: str) -> Dict[str, Any]:
        """
        Use LLM to extract parameters for a specific tool from the query.

        Args:
            tool: The tool instance
            query: The user query

        Returns:
            Dictionary of extracted parameters
        """
        # If the tool has no parameters, return empty dict
        if not tool.parameters:
            return {}

        try:
            # Generate parameter extraction prompt
            prompt = self._generate_parameter_extraction_prompt(tool, query)

            # Call the LLM to extract parameters
            params = self._call_llm_for_parameter_extraction(prompt)

            # Convert parameter types based on tool parameter definitions
            typed_params = self._convert_parameter_types(tool, params)

            # Log the extracted parameters
            logger.info(f"Extracted parameters for {tool.name}: {typed_params}")

            return typed_params
        except Exception as e:
            logger.error(f"Error extracting parameters with LLM: {e}")
            logger.error(traceback.format_exc())
            return {}

    def _generate_parameter_extraction_prompt(self, tool: BaseTool, query: str) -> str:
        """
        Generate a prompt for the LLM to extract parameters.

        Args:
            tool: The tool instance
            query: The user query

        Returns:
            A formatted prompt string
        """
        tool_schema = tool.get_schema()

        # Create a detailed parameters section
        params_info = []
        for param in tool.parameters:
            required_str = "required" if param.required else "optional"
            default_str = (
                f" (default: {param.default})" if param.default is not None else ""
            )
            enum_str = (
                f" (possible values: {', '.join(param.enum)})" if param.enum else ""
            )

            params_info.append(
                f"- {param.name} ({param.type.value}, {required_str}){default_str}{enum_str}: {param.description}"
            )

        params_text = "\n".join(params_info)

        # Format the prompt with detailed extraction instructions
        prompt = f"""You are an AI assistant that helps extract parameters from a user query.
You will be given information about a tool and a user query. Your task is to extract the parameters for the tool from the query.

Tool: {tool.name}
Description: {tool.description}

Parameters:
{params_text}

Examples of uses:
{chr(10).join(f"- {example}" for example in tool.examples)}

User query: "{query}"

Be smart about extracting parameters:
- If a parameter is required but not present in the query, do not include it in your response
- Only include parameters if you're confident they are correctly extracted from the query
- For string parameters, extract the exact text mentioned in the query
- For numeric parameters, convert text numbers to actual numbers (e.g., "five" -> 5)
- If a parameter has possible values (enum), make sure the extracted value matches one of them

You must respond with a JSON object containing the extracted parameters:
{{
  "parameter_name": parameter_value,
  ...
}}

ONLY include the JSON object in your response, with no additional text.
Response:"""

        return prompt

    def _call_llm_for_parameter_extraction(self, prompt: str) -> Dict[str, Any]:
        """
        Call the LLM to extract parameters.

        Args:
            prompt: The formatted prompt

        Returns:
            Dictionary of extracted parameters
        """
        url = settings.LLM_API_URL

        # Define the payload for the API
        payload = {
            "model": settings.LLM_MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.1,  # Lower temperature for more deterministic results
            "max_tokens": 500,  # Ensure we get a complete response
        }

        try:
            # Make the API call
            response = requests.post(url, json=payload, timeout=10)  # Reduced timeout

            if response.status_code == 200:
                result = response.json()
                llm_response = result.get("response", "{}")

                # Log the raw response for debugging
                logger.debug(f"LLM parameter extraction raw response: {llm_response}")

                # Extract just the JSON part from the response
                json_pattern = r"\{.*\}"
                json_match = re.search(json_pattern, llm_response, re.DOTALL)

                if json_match:
                    try:
                        json_data = json.loads(json_match.group(0))
                        return json_data
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing JSON from LLM response: {e}")
                        logger.error(f"Response content: {llm_response}")
                        return {}
                else:
                    logger.error(
                        f"No JSON object found in LLM response: {llm_response}"
                    )
                    return {}
            else:
                logger.error(
                    f"Error calling LLM API: {response.status_code} - {response.text}"
                )
                return {}

        except requests.RequestException as e:
            logger.error(f"Request exception calling LLM API: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected exception calling LLM API: {e}")
            logger.error(traceback.format_exc())
            return {}

    def _convert_parameter_types(
        self, tool: BaseTool, params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Convert parameter values to their correct types based on tool parameter definitions.

        Args:
            tool: The tool instance
            params: Dictionary of parameters extracted from LLM

        Returns:
            Dictionary with correctly typed parameter values
        """
        if not params:
            return {}

        typed_params = {}
        param_defs = {p.name: p for p in tool.parameters}

        for name, value in params.items():
            if name not in param_defs:
                # Skip parameters that don't exist in the tool definition
                continue

            param_def = param_defs[name]
            param_type = param_def.type

            try:
                # Convert the value based on the parameter type
                if param_type == ToolParameterType.INTEGER and not isinstance(
                    value, int
                ):
                    if isinstance(value, str) and value.isdigit():
                        typed_params[name] = int(value)
                    elif isinstance(value, float):
                        typed_params[name] = int(value)
                    else:
                        # Skip if we can't convert to int
                        continue

                elif param_type == ToolParameterType.FLOAT and not isinstance(
                    value, float
                ):
                    if isinstance(value, (str, int)):
                        try:
                            typed_params[name] = float(value)
                        except ValueError:
                            # Skip if we can't convert to float
                            continue
                    else:
                        # Skip if we can't convert to float
                        continue

                elif param_type == ToolParameterType.BOOLEAN and not isinstance(
                    value, bool
                ):
                    if isinstance(value, str):
                        if value.lower() in ("true", "yes", "1"):
                            typed_params[name] = True
                        elif value.lower() in ("false", "no", "0"):
                            typed_params[name] = False
                        else:
                            # Skip if we can't convert to boolean
                            continue
                    else:
                        # Convert non-string/non-boolean to boolean (0 = False, non-0 = True)
                        typed_params[name] = bool(value)

                else:
                    # For STRING, ARRAY, OBJECT, just keep the value as is
                    typed_params[name] = value

            except Exception as e:
                logger.error(
                    f"Error converting parameter {name} value {value} to {param_type}: {e}"
                )
                # Skip parameters that couldn't be converted
                continue

        return typed_params
