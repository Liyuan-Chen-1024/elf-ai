from backend.apps.core.registry import registry, Integration


@Integration.register()
class APIIntegration(Integration):
    """
    Integration for making API requests.
    This is a base integration that can be used by other integrations.
    """
    def __init__(self, instance_id: str, **kwargs):
        self.timeout = kwargs.get("timeout", 30)
        self.verify_ssl = kwargs.get("verify_ssl", True)
        self.default_headers = kwargs.get("default_headers", {})
        self.base_url = kwargs.get("base_url", "")
        super().__init__(instance_id, **kwargs)
    
    def get_integration(self):
        return {
            "type": "api",
            "id": self.instance_id,
            "timeout": self.timeout,
            "verify_ssl": self.verify_ssl,
            "default_headers": self.default_headers,
            "base_url": self.base_url
        }
    
    def build_url(self, path_or_url: str) -> str:
        """
        Build a complete URL, using base_url if provided.
        
        Args:
            path_or_url: Either a full URL or a path to append to base_url
            
        Returns:
            Complete URL to use for the request
        """
        # If it's a complete URL or we don't have a base_url, use as is
        if path_or_url.startswith(('http://', 'https://')) or not self.base_url:
            return path_or_url
        
        # Otherwise, combine with base_url
        return f"{self.base_url.rstrip('/')}/{path_or_url.lstrip('/')}"
    
    def request(self, method: str, path_or_url: str, **kwargs):
        """
        Make an API request.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            path_or_url: Either a full URL or a path to append to base_url
            **kwargs: Additional parameters for the request
            
        Returns:
            Response from the API
        """
        # Build complete URL
        url = self.build_url(path_or_url)
        
        # Merge default headers with provided headers
        headers = self.default_headers.copy()
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
            kwargs["headers"] = headers
        
        # This would typically use a library like requests
        # For now, just return a simulated response
        return {
            "method": method,
            "url": url,
            "status": 200,
            "body": f"Simulated response from {url}",
            "headers": headers
        }
    
    def get(self, path_or_url: str, **kwargs):
        """
        Make a GET request.
        
        Args:
            path_or_url: Either a full URL or a path to append to base_url
            **kwargs: Additional parameters for the request
            
        Returns:
            Response from the API
        """
        return self.request("GET", path_or_url, **kwargs)
    
    def post(self, path_or_url: str, data=None, json=None, **kwargs):
        """
        Make a POST request.
        
        Args:
            path_or_url: Either a full URL or a path to append to base_url
            data: Form data to send
            json: JSON data to send
            **kwargs: Additional parameters for the request
            
        Returns:
            Response from the API
        """
        return self.request("POST", path_or_url, data=data, json=json, **kwargs)
    
    def put(self, path_or_url: str, data=None, json=None, **kwargs):
        """
        Make a PUT request.
        
        Args:
            path_or_url: Either a full URL or a path to append to base_url
            data: Form data to send
            json: JSON data to send
            **kwargs: Additional parameters for the request
            
        Returns:
            Response from the API
        """
        return self.request("PUT", path_or_url, data=data, json=json, **kwargs)
    
    def delete(self, path_or_url: str, **kwargs):
        """
        Make a DELETE request.
        
        Args:
            path_or_url: Either a full URL or a path to append to base_url
            **kwargs: Additional parameters for the request
            
        Returns:
            Response from the API
        """
        return self.request("DELETE", path_or_url, **kwargs) 
    
    