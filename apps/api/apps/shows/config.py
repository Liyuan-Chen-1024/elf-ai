from pathlib import Path
from typing import Optional

from pydantic import BaseSettings, Field, validator


class MediaSettings(BaseSettings):
    """
    Media application settings with validation and type safety.
    
    This class handles configuration for:
    - Download paths and directories
    - Transmission client settings
    - Download rate thresholds
    - File naming and organization
    """
    
    # Base paths
    MEDIA_ROOT: Path = Field(
        default=Path("/data"),
        description="Root directory for all media files"
    )
    TV_SHOWS_DIR: Path = Field(
        default=Path("/data/tv"),
        description="Directory for TV show downloads"
    )
    MOVIES_DIR: Path = Field(
        default=Path("/data/movies"),
        description="Directory for movie downloads"
    )
    
    # Transmission settings
    TX_HOST: str = Field(
        default="localhost",
        description="Transmission RPC host"
    )
    TX_PORT: int = Field(
        default=9091,
        description="Transmission RPC port"
    )
    TX_USERNAME: Optional[str] = Field(
        default=None,
        description="Transmission RPC username"
    )
    TX_PASSWORD: Optional[str] = Field(
        default=None,
        description="Transmission RPC password"
    )
    
    # Download settings
    MIN_DOWNLOAD_RATE: int = Field(
        default=150,
        description="Minimum acceptable download rate in KB/s"
    )
    RATE_RATIO_THRESHOLD: float = Field(
        default=0.5,
        description="Threshold ratio compared to average download rate"
    )
    MAX_CONCURRENT_DOWNLOADS: int = Field(
        default=3,
        description="Maximum number of concurrent downloads"
    )
    
    # File organization
    TV_SHOW_FILENAME_TEMPLATE: str = Field(
        default="{show_name}/Season {season:02d}/{show_name} - S{season:02d}E{episode:02d}",
        description="Template for TV show episode filenames"
    )
    MOVIE_FILENAME_TEMPLATE: str = Field(
        default="{movie_name} ({year})",
        description="Template for movie filenames"
    )
    
    class Config:
        env_prefix = "JARVIS_"
        case_sensitive = True
        
    @validator("*", pre=True)
    def create_directories(cls, v, field):
        """Ensure directories exist for Path fields."""
        if isinstance(v, Path) and field.name.endswith("_DIR"):
            v.mkdir(parents=True, exist_ok=True)
        return v
    
    def get_show_path(self, show_name: str) -> Path:
        """Get the path for a TV show."""
        return self.TV_SHOWS_DIR / show_name
    
    def get_movie_path(self, movie_name: str, year: int) -> Path:
        """Get the path for a movie."""
        return self.MOVIES_DIR / f"{movie_name} ({year})"
    
    def get_episode_filename(self, show_name: str, season: int, episode: int) -> str:
        """Get the filename for a TV show episode."""
        return self.TV_SHOW_FILENAME_TEMPLATE.format(
            show_name=show_name,
            season=season,
            episode=episode
        )


# Create a global settings instance
settings = MediaSettings() 