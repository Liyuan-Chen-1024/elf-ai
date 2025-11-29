from backend.apps.core.registry import registry, Service
from backend.apps.integrations.llm.query import LLMQuery
from backend.apps.integrations.smart_home.philips_hue import PhilipsHueIntegration


@Service.register()
class SmartHomeService(Service):
    """
    Smart home service that coordinates multiple smart home integrations.
    """
    # Define required integrations using class references
    required_integrations = [PhilipsHueIntegration, LLMQuery]
    
    def __init__(self, instance_id: str, **kwargs):
        super().__init__(instance_id, **kwargs)
    
    def execute(self, command: str, **kwargs):
        """
        Execute a smart home command.
        
        Args:
            command: Natural language command 
            **kwargs: Additional parameters
        
        Returns:
            Result of the command execution
        """
        # Get required integrations
        hue = self.get_integration(PhilipsHueIntegration)
        llm = self.get_integration(LLMQuery)
        
        # Use LLM to parse the natural language command
        parsed_command = llm.query(
            prompt=f"Parse this smart home command into structured data: '{command}'",
            max_tokens=100
        )
        
        # This is a simplified example - in a real implementation,
        # we would properly parse the LLM response
        
        # For demonstration, we'll just handle a simple light command
        if "light" in command.lower():
            if "on" in command.lower():
                result = hue.set_light("1", {"on": True})
                return {
                    "command": command,
                    "action": "light_on",
                    "result": result
                }
            elif "off" in command.lower():
                result = hue.set_light("1", {"on": False})
                return {
                    "command": command,
                    "action": "light_off",
                    "result": result
                }
        
        return {
            "command": command,
            "error": "Command not understood"
        } 