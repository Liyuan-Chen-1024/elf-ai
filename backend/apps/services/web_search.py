from backend.apps.core.registry import registry, Service
from backend.apps.integrations.llm.query import LLMQuery
from backend.apps.integrations.api import APIIntegration


@Service.register()
class WebSearchService(Service):
    """
    Web search service that combines multiple integrations to provide
    enhanced search capabilities.
    """
    # Define required integrations using class references
    required_integrations = [LLMQuery, APIIntegration]
    
    def __init__(self, instance_id: str, **kwargs):
        self.max_results = kwargs.get("max_results", 10)
        self.search_engine = kwargs.get("search_engine", "google")
        super().__init__(instance_id, **kwargs)
    
    def execute(self, query: str, **kwargs):
        """
        Perform a web search.
        
        Args:
            query: The search query
            **kwargs: Additional parameters for the search
        
        Returns:
            Search results
        """
        # Get required integrations
        llm = self.get_integration(LLMQuery)
        api = self.get_integration(APIIntegration)
        
        # Override defaults with kwargs
        max_results = kwargs.get("max_results", self.max_results)
        
        # Use the API integration to perform the search
        search_url = f"https://api.{self.search_engine}.com/search"
        search_results = api.get(search_url, params={"q": query, "num": max_results})
        
        # Use LLM to enhance search results
        enhanced_results = llm.query(
            prompt=f"Summarize these search results: {search_results}",
            max_tokens=100
        )
        
        return {
            "query": query,
            "results": search_results,
            "summary": enhanced_results,
            "count": max_results
        }
    
    def search(self, query: str, **kwargs):
        """
        Alias for execute() with a more intuitive name.
        """
        return self.execute(query, **kwargs) 