from backend.apps.core.registry import registry, Integration
from openai import OpenAI


@Integration.register()
class OllamaIntegration(Integration):
    """
    Integration for Ollama (or any OpenAI compatible) LLM service.
    """

    # No dependencies needed as we use the openai client library directly
    dependencies = []

    def __init__(self, instance_id: str, **kwargs):
        # Default configuration
        self.base_url = kwargs.get("base_url", "http://llm.local.carlsen.io/v1")
        self.model = kwargs.get("model", "gemma3")
        self.api_key = kwargs.get("api_key", "not-needed")

        # Initialize dependencies
        super().__init__(instance_id, **kwargs)
        
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)

    def get_integration(self):
        return {
            "type": "ollama",
            "id": self.instance_id,
            "base_url": self.base_url,
            "model": self.model,
        }

    def query(self, prompt: str, **kwargs):
        """
        Send a query to Ollama.

        Args:
            prompt: The prompt to send to Ollama
            **kwargs: Additional parameters for the query

        Returns:
            The response from Ollama
        """
        # Override defaults with kwargs
        model = kwargs.get("model", self.model)

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                stream=False,
                **{k: v for k, v in kwargs.items() if k not in ["model", "stream"]}
            )
            
            content = response.choices[0].message.content
            
            return {
                "model": model,
                "response": content,
                "prompt": prompt,
            }
        except Exception as e:
            return {
                "model": model,
                "error": str(e),
                "prompt": prompt,
            }
