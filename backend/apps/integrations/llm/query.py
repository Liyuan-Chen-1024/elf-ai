from backend.apps.core.registry import registry, Integration
from backend.apps.integrations.llm.ollama import OllamaIntegration


@Integration.register()
class LLMQuery(Integration):
    """
    Integration for querying LLM providers.
    This integration depends on specific LLM backend integrations.
    """
    # Define possible dependencies using class references
    dependencies = [OllamaIntegration]
    
    def __init__(self, instance_id: str, **kwargs):
        super().__init__(instance_id, **kwargs)
        
    def get_integration(self):
        # Access dependencies as needed
        ollama = self.get_dependency(OllamaIntegration)
        
        return {
            "type": "llm_query",
            "id": self.instance_id,
            "provider": ollama.get_integration() if ollama else None
        }
        
    def query(self, prompt: str, **kwargs):
        """
        Send a query to the LLM provider.
        
        Args:
            prompt: The prompt to send to the LLM
            **kwargs: Additional parameters for the query
            
        Returns:
            The response from the LLM
        """
        # Access the LLM provider integration
        ollama = self.get_dependency(OllamaIntegration)
        
        if not ollama:
            return {
                "error": "No LLM provider available",
                "prompt": prompt
            }

        # Use the provider to make the query
        return ollama.query(prompt, **kwargs)
