"""Base service classes for the application."""
from typing import Any, Dict, List, Optional, TypeVar, Generic

from django.db.models import Model, QuerySet

ModelType = TypeVar('ModelType', bound=Model)


class BaseService(Generic[ModelType]):
    """Base service class for models."""
    
    def __init__(self):
        """Initialize service."""
        pass
        
    def get_queryset(self) -> Optional[QuerySet[ModelType]]:
        """Get the base queryset for the service.
        
        Returns:
            Base queryset or None if not applicable
        """
        return None
        
    def get_by_id(self, id: int) -> Optional[ModelType]:
        """Get a model instance by ID.
        
        Args:
            id: Model instance ID
            
        Returns:
            Model instance if found, None otherwise
        """
        queryset = self.get_queryset()
        if queryset is None:
            return None
        try:
            return queryset.get(id=id)
        except Model.DoesNotExist:
            return None
            
    def list(self, **filters: Any) -> List[ModelType]:
        """List model instances.
        
        Args:
            **filters: Filter arguments
            
        Returns:
            List of model instances
        """
        queryset = self.get_queryset()
        if queryset is None:
            return []
        return list(queryset.filter(**filters))
        
    def create(self, **data: Any) -> Optional[ModelType]:
        """Create a new model instance.
        
        Args:
            **data: Instance data
            
        Returns:
            Created instance if successful, None otherwise
        """
        queryset = self.get_queryset()
        if queryset is None:
            return None
        try:
            return queryset.create(**data)
        except Exception:
            return None
            
    def update(self, instance: ModelType, **data: Any) -> bool:
        """Update a model instance.
        
        Args:
            instance: Model instance to update
            **data: Update data
            
        Returns:
            True if update was successful, False otherwise
        """
        try:
            for key, value in data.items():
                setattr(instance, key, value)
            instance.save()
            return True
        except Exception:
            return False
            
    def delete(self, instance: ModelType) -> bool:
        """Delete a model instance.
        
        Args:
            instance: Model instance to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            instance.delete()
            return True
        except Exception:
            return False 