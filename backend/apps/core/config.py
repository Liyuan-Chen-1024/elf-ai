"""Configuration settings for the application."""

from pydantic import Field
from pydantic_settings import BaseSettings


class CoreSettings(BaseSettings):
    """Application settings using Pydantic for validation."""

    # API settings
    API_BASE_URL: str = Field(
        default="https://epguides.frecar.no", description="Base URL for the API"
    )
    API_TIMEOUT: int = Field(default=10, description="API request timeout in seconds")
    API_RETRIES: int = Field(default=3, description="Number of API request retries")

    # Cache settings
    CACHE_TTL: int = Field(default=3600, description="Default cache TTL in seconds")

    # Batch processing
    BATCH_SIZE: int = Field(default=50, description="Default batch size for processing")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Default logging level")

    # Storage paths
    MEDIA_ROOT: str = Field(
        default="/media", description="Root directory for media files"
    )
    DOWNLOAD_DIR: str = Field(
        default="/downloads", description="Directory for downloaded files"
    )

    class Config:
        """Pydantic config."""

        env_prefix = "ELFAI_"  # Environment variables prefix
        case_sensitive = False


# Create a global settings instance
settings = CoreSettings()
