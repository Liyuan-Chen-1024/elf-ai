"""
Registry system for managing integrations and services.
"""
from typing import Dict, Type, Any, List, ClassVar, TypeVar

# Type variables for better IDE support
T = TypeVar('T')

class Registry:
    """Registry that maintains separate collections for integrations and services"""
    
    def __init__(self):
        self._integrations: Dict[Type, Type] = {}
        self._services: Dict[Type, Type] = {}
        self._instances: Dict[str, Any] = {}
    
    def register_integration(self, cls: Type) -> Type:
        """Register an integration class"""
        self._integrations[cls] = cls
        return cls
        
    def register_service(self, cls: Type) -> Type:
        """Register a service class"""
        self._services[cls] = cls
        return cls
    
    def get_instance(self, cls: Type[T], instance_id: str = "default", **kwargs) -> T:
        """Get or create an instance of a registered class"""
        key = f"{cls.__name__}:{instance_id}"
        
        # Return cached instance if available
        if key in self._instances:
            return self._instances[key]
        
        # Create new instance based on type
        if cls in self._integrations or cls in self._services:
            instance = cls(instance_id=instance_id, **kwargs)
            self._instances[key] = instance
            return instance
            
        raise KeyError(f"Class {cls.__name__} not registered as integration or service")
    
    def get_all_integrations(self) -> Dict[Type, Type]:
        """Get all registered integrations"""
        return self._integrations.copy()
        
    def get_all_services(self) -> Dict[Type, Type]:
        """Get all registered services"""
        return self._services.copy()

    def clear(self):
        """Clear all instances (useful for testing)"""
        self._instances.clear()




class Integration:
    """Base class for all integrations"""
    
    # Class attribute for dependencies - override in subclasses
    dependencies: ClassVar[List[Type['Integration']]] = []
    
    def __init__(self, instance_id: str, **kwargs):
        self.instance_id = instance_id
        self._deps = {}
        self._init_dependencies(**kwargs)
    
    def _init_dependencies(self, **kwargs):
        """Initialize dependencies"""
        for dep_cls in self.dependencies:
            # Allow dependency override from kwargs
            dep_name = dep_cls.__name__.lower()
            if dep_name in kwargs:
                self._deps[dep_cls] = kwargs[dep_name]
            else:
                # Get or create dependency instance
                try:
                    dep = registry.get_instance(dep_cls)
                    self._deps[dep_cls] = dep
                except KeyError:
                    class_name = self.__class__.__name__
                    dep_class_name = dep_cls.__name__
                    raise ValueError(f"{class_name} requires {dep_class_name} which is not registered")
    
    def get_dependency(self, cls: Type[T]) -> T:
        """Get a dependency by class"""
        if cls in self._deps:
            return self._deps[cls]
        raise ValueError(f"Dependency {cls.__name__} not found")
    
    def get_integration(self) -> Any:
        """Get integration data - implement in subclasses"""
        raise NotImplementedError("Subclasses must implement get_integration")
    
    @classmethod
    def register(cls):
        """Register this integration with the registry"""
        return registry.register_integration(cls) 
    

class Service:
    """Base class for services that use integrations"""
    
    # Override in subclasses
    required_integrations: ClassVar[List[Type[Integration]]] = []
    
    def __init__(self, instance_id: str, **kwargs):
        self.instance_id = instance_id
        self._integrations = {}
        self._init_integrations(**kwargs)
    
    def _init_integrations(self, **kwargs):
        """Initialize required integrations"""
        for int_cls in self.required_integrations:
            # Allow integration override from kwargs
            int_name = int_cls.__name__.lower()
            if int_name in kwargs:
                self._integrations[int_cls] = kwargs[int_name]
            else:
                try:
                    integration = registry.get_instance(int_cls)
                    self._integrations[int_cls] = integration
                except KeyError:
                    class_name = self.__class__.__name__
                    int_class_name = int_cls.__name__
                    raise ValueError(f"{class_name} requires {int_class_name} which is not registered")
    
    def get_integration(self, cls: Type[T]) -> T:
        """Get a required integration by class"""
        if cls in self._integrations:
            return self._integrations[cls]
        raise ValueError(f"Integration {cls.__name__} not found")
    
    def execute(self, *args, **kwargs) -> Any:
        """Execute the service - implement in subclasses"""
        raise NotImplementedError("Subclasses must implement execute")
    
    @classmethod
    def register(cls):
        """Register this service with the registry"""
        return registry.register_service(cls) 
    

# Create a singleton instance of the registry
registry = Registry() 