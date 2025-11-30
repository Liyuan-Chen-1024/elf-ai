import json
import logging
from typing import Any, Dict, List, Optional, Protocol

import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

class Tool(Protocol):
    name: str
    description: str
    parameters: Dict[str, Any]

    def execute(self, **kwargs) -> str:
        ...

    def to_openai_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class WebSearchTool:
    name = "web_search"
    description = "Search the internet for current information, facts, or news. Returns a list of results with snippets and URLs."
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to look up."
            }
        },
        "required": ["query"]
    }

    def execute(self, query: str) -> str:
        """Execute DuckDuckGo search."""
        try:
            logger.info(f"Executing web search for: {query}")
            # Add a timeout to prevent hanging indefinitely
            with DDGS(timeout=20) as ddgs:
                results = list(ddgs.text(query, max_results=5))
            
            if not results:
                return "No results found."
            
            formatted_results = f"Search results for '{query}':\n\n"
            for i, r in enumerate(results, 1):
                formatted_results += f"{i}. {r['title']}\n   {r['body']}\n   URL: {r['href']}\n\n"
            
            return formatted_results
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return f"Search failed: {str(e)}"

    def to_openai_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class WebFetchTool:
    name = "web_fetch"
    description = "Fetch and read the full text content of a specific URL. Use this to get details from a search result."
    parameters = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "The URL to fetch content from."
            }
        },
        "required": ["url"]
    }

    def execute(self, url: str) -> str:
        """Fetch and parse URL content."""
        try:
            logger.info(f"Fetching URL: {url}")
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; ElfAI/1.0; +http://example.com)"
            }
            with httpx.Client(timeout=15.0, follow_redirects=True, headers=headers) as client:
                response = client.get(url)
                response.raise_for_status()
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
                script.extract()
            
            # Get text
            text = soup.get_text()
            
            # Break into lines and remove leading/trailing space on each
            lines = (line.strip() for line in text.splitlines())
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            # Drop blank lines
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            # Limit length to avoid overflowing context
            max_length = 8000
            if len(text) > max_length:
                text = text[:max_length] + "\n...(content truncated)..."
            
            return f"Content from {url}:\n\n{text}"
            
        except Exception as e:
            logger.error(f"Fetch failed for {url}: {e}")
            return f"Failed to fetch URL {url}: {str(e)}"

    def to_openai_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        self._tools[tool.name] = tool
    
    def get_tool(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)
    
    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_openai_schema() for tool in self._tools.values()]


# Global registry instance
registry = ToolRegistry()
registry.register(WebSearchTool())
registry.register(WebFetchTool())
