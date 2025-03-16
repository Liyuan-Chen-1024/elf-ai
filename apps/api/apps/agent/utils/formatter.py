"""
Formatter utilities for agent tool results.

This module provides helpers to format tool results into user-friendly
chat messages for display in the conversation.
"""

from typing import Any, Dict, List, Optional

from ..tools import ToolResult


class ToolResultFormatter:
    """
    Formatter for converting tool results into human-readable messages.
    """
    
    @staticmethod
    def format_result(tool_name: str, result: ToolResult) -> str:
        """
        Format a tool result as a markdown message for display in the chat.
        
        Args:
            tool_name: The name of the tool that produced the result
            result: The ToolResult object to format
            
        Returns:
            Formatted markdown string for display
        """
        if not result.success:
            return ToolResultFormatter._format_error(tool_name, result.error_message)
        
        # Use specialized formatters based on tool name
        if tool_name == "tv_show_search":
            return ToolResultFormatter._format_tv_show_search(result.data)
        elif tool_name == "tv_show_episode":
            return ToolResultFormatter._format_tv_show_episode(result.data)
        elif tool_name == "hue_lights":
            return ToolResultFormatter._format_hue_lights(result.data)
        elif tool_name == "get_tv_shows":
            return ToolResultFormatter._format_get_tv_shows(result.data)
        elif tool_name == "add_tv_show":
            return ToolResultFormatter._format_add_tv_show(result.data)
        elif tool_name == "get_movies":
            return ToolResultFormatter._format_get_movies(result.data)
        elif tool_name == "add_movie":
            return ToolResultFormatter._format_add_movie(result.data)
        
        # Generic formatter for other tools
        return ToolResultFormatter._format_generic(tool_name, result.data)
    
    @staticmethod
    def _format_error(tool_name: str, error_message: Optional[str]) -> str:
        """Format an error message."""
        tool_display = tool_name.replace("_", " ").title()
        
        if not error_message:
            error_message = "An unknown error occurred."
            
        return f"""📛 **{tool_display} Error**

{error_message}

Please try again with different parameters."""
    
    @staticmethod
    def _format_generic(tool_name: str, data: Any) -> str:
        """Format generic tool results."""
        tool_display = tool_name.replace("_", " ").title()
        
        if not data:
            return f"✅ **{tool_display}** completed successfully."
        
        # Convert data to a pretty string representation
        if isinstance(data, dict):
            data_str = "\n".join([f"**{k}**: {v}" for k, v in data.items()])
        elif isinstance(data, list):
            data_str = "\n".join([f"- {item}" for item in data])
        else:
            data_str = str(data)
        
        return f"""✅ **{tool_display} Result**

{data_str}"""
    
    @staticmethod
    def _format_tv_show_search(data: Dict[str, Any]) -> str:
        """Format TV show search results."""
        results = data.get("results", [])
        count = data.get("count", 0)
        query = data.get("query", "")
        
        if count == 0:
            return f"""🔍 **TV Show Search**

No results found for "{query}".
Try a different search term."""
        
        # Format the result list
        result_list = ""
        for i, show in enumerate(results, 1):
            title = show.get("title", "Unknown")
            status = show.get("status", "Unknown")
            genre = show.get("genre", "Unknown")
            current_season = show.get("current_season", "Unknown")
            current_episode = show.get("current_episode", "Unknown")
            
            result_list += f"""**{i}. {title}**
   Status: {status}
   Genre: {genre}
   Current: Season {current_season}, Episode {current_episode}
   
"""
        
        return f"""🔍 **TV Show Search Results**

Found {count} show{'s' if count != 1 else ''} matching "{query}":

{result_list.strip()}

To view details or manage episodes, reference a show by its name or number."""
    
    @staticmethod
    def _format_tv_show_episode(data: Dict[str, Any]) -> str:
        """Format TV show episode information."""
        show_id = data.get("show_id", "Unknown")
        title = data.get("title", "Unknown")
        
        # Check which action was performed
        if "current_season" in data and "current_episode" in data:
            # Current episode info
            current_season = data.get("current_season", "Unknown")
            current_episode = data.get("current_episode", "Unknown")
            next_date = data.get("next_episode_date", "Unknown")
            
            return f"""📺 **{title}** (ID: {show_id})

**Current Progress:**
Season {current_season}, Episode {current_episode}

**Next Episode:**
{next_date if next_date else "No information available"}"""
        
        elif "next_season" in data and "next_episode" in data:
            # Next episode info
            next_season = data.get("next_season", "Unknown")
            next_episode = data.get("next_episode", "Unknown")
            air_date = data.get("air_date", "Unknown")
            
            return f"""📺 **{title}** (ID: {show_id})

**Next Episode:**
Season {next_season}, Episode {next_episode}
Air Date: {air_date if air_date else "Unknown"}"""
        
        elif "marked_watched" in data:
            # Marked as watched
            marked = data.get("marked_watched", {})
            season = marked.get("season", "Unknown")
            episode = marked.get("episode", "Unknown")
            
            current_season = data.get("current_season", "Unknown")
            current_episode = data.get("current_episode", "Unknown")
            
            return f"""✅ **{title}** (ID: {show_id})

**Marked as Watched:**
Season {season}, Episode {episode}

**Current Progress:**
Season {current_season}, Episode {current_episode}"""
        
        elif "downloaded" in data:
            # Downloaded episode
            downloaded = data.get("downloaded", {})
            season = downloaded.get("season", "Unknown")
            episode = downloaded.get("episode", "Unknown")
            filename = downloaded.get("filename", "Unknown")
            
            return f"""⬇️ **{title}** (ID: {show_id})

**Downloaded:**
Season {season}, Episode {episode}

**Filename:**
{filename}"""
        
        else:
            # Generic show information
            return f"""📺 **{title}** (ID: {show_id})

{data}"""
    
    @staticmethod
    def _format_hue_lights(data: Dict[str, Any]) -> str:
        """Format Hue lights information."""
        # Check for list of lights
        if "lights" in data:
            lights = data.get("lights", [])
            lights_list = ""
            
            for light in lights:
                light_id = light.get("id", "Unknown")
                name = light.get("name", "Unknown")
                status = "On" if light.get("on", False) else "Off"
                brightness = light.get("brightness", 0)
                
                lights_list += f"""**{name}** (ID: {light_id})
   Status: {status}
   Brightness: {brightness}%
   
"""
            
            return f"""💡 **Hue Lights**

{lights_list.strip()}"""
        
        # Check for specific light info
        elif "name" in data:
            name = data.get("name", "Unknown")
            light_id = data.get("id", "Unknown")
            status = "On" if data.get("on", False) else "Off"
            brightness = data.get("brightness", 0)
            color = data.get("color", "Unknown")
            
            return f"""💡 **{name}** (ID: {light_id})

**Status:** {status}
**Brightness:** {brightness}%
**Color:** {color}"""
        
        # Check for light state change
        elif "state" in data:
            light_id = data.get("id", "Unknown")
            state = data.get("state", "Unknown")
            message = data.get("message", "")
            
            return f"""💡 **Hue Light** (ID: {light_id})

**Action:** The light is now {state}.
{message}"""
        
        # Check for brightness change
        elif "brightness" in data:
            light_id = data.get("id", "Unknown")
            brightness = data.get("brightness", 0)
            message = data.get("message", "")
            
            return f"""💡 **Hue Light** (ID: {light_id})

**Action:** Brightness set to {brightness}%.
{message}"""
        
        # Check for color change
        elif "color" in data:
            light_id = data.get("id", "Unknown")
            color = data.get("color", "Unknown")
            message = data.get("message", "")
            
            return f"""💡 **Hue Light** (ID: {light_id})

**Action:** Color changed to {color}.
{message}"""
        
        # Check for scene activation
        elif "scene" in data:
            scene = data.get("scene", "Unknown")
            message = data.get("message", "")
            
            return f"""🏮 **Hue Scene**

**Action:** "{scene}" scene activated.
{message}"""
        
        else:
            # Generic light information
            return f"""💡 **Hue Lights**

{data}"""
    
    @staticmethod
    def _format_get_tv_shows(data: Dict[str, Any]) -> str:
        """Format TV shows list."""
        shows = data.get("shows", [])
        count = data.get("count", 0)
        
        if count == 0:
            return "📺 **TV Show Library**\n\nNo TV shows found in your library."
        
        # Format the show list
        show_list = ""
        for i, show in enumerate(shows, 1):
            title = show.get("title", "Unknown")
            seasons = show.get("seasons", "Unknown")
            status = show.get("status", "Unknown")
            
            show_list += f"**{i}. {title}**\n"
            show_list += f"   Seasons: {seasons}\n"
            show_list += f"   Status: {status}\n\n"
        
        return f"""📺 **TV Show Library**

Found {count} show{'s' if count != 1 else ''} in your library:

{show_list.strip()}"""

    @staticmethod
    def _format_add_tv_show(data: Dict[str, Any]) -> str:
        """Format add TV show result."""
        title = data.get("title", "Unknown")
        season = data.get("season")
        message = data.get("message", "")
        
        season_text = f" Season {season}" if season else ""
        
        return f"""✅ **Added to Download Queue**

**Title:** {title}{season_text}

{message}

I'll start downloading this show for you. It will be available in your Plex library soon."""

    @staticmethod
    def _format_get_movies(data: Dict[str, Any]) -> str:
        """Format movies list."""
        movies = data.get("movies", [])
        count = data.get("count", 0)
        
        if count == 0:
            return "🎬 **Movie Library**\n\nNo movies found in your library."
        
        # Format the movie list
        movie_list = ""
        for i, movie in enumerate(movies, 1):
            title = movie.get("title", "Unknown")
            year = movie.get("year", "Unknown")
            genre = movie.get("genre", "Unknown")
            
            movie_list += f"**{i}. {title}** ({year})\n"
            movie_list += f"   Genre: {genre}\n\n"
        
        return f"""🎬 **Movie Library**

Found {count} movie{'s' if count != 1 else ''} in your library:

{movie_list.strip()}"""

    @staticmethod
    def _format_add_movie(data: Dict[str, Any]) -> str:
        """Format add movie result."""
        title = data.get("title", "Unknown")
        year = data.get("year")
        message = data.get("message", "")
        
        year_text = f" ({year})" if year else ""
        
        return f"""✅ **Added to Download Queue**

**Title:** {title}{year_text}

{message}

I'll start downloading this movie for you. It will be available in your Plex library soon.""" 