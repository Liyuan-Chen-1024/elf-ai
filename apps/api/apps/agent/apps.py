from django.apps import AppConfig


class AgentConfig(AppConfig):
    """Agent tools system for Elf AI."""
    
    name = 'apps.agent'
    verbose_name = 'Agent Tools'
    
    def ready(self):
        """Initialize the agent system when Django starts."""
        # Import and discover tools
        from .tools.registry import discover_tools
        discover_tools() 