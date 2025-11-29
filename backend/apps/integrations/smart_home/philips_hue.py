from backend.apps.core.registry import registry, Integration
from backend.apps.integrations.api import APIIntegration


@Integration.register()
class PhilipsHueIntegration(Integration):
    """
    Integration for Philips Hue smart lighting system.
    """
    # Define dependencies using class references
    dependencies = [APIIntegration]
    
    def __init__(self, instance_id: str, **kwargs):
        self.bridge_ip = kwargs.get("bridge_ip", "192.168.1.100")
        self.username = kwargs.get("username", "default-username")
        super().__init__(instance_id, **kwargs)
    
    def get_integration(self):
        api = self.get_dependency(APIIntegration)
        return {
            "type": "philips_hue",
            "id": self.instance_id,
            "bridge_ip": self.bridge_ip,
            "username": self.username
        }
    
    def get_lights(self):
        """Get all available lights"""
        api = self.get_dependency(APIIntegration)
        url = f"http://{self.bridge_ip}/api/{self.username}/lights"
        return api.get(url)
    
    def set_light(self, light_id: str, state: dict):
        """Set the state of a light"""
        api = self.get_dependency(APIIntegration)
        url = f"http://{self.bridge_ip}/api/{self.username}/lights/{light_id}/state"
        return api.put(url, json=state) 