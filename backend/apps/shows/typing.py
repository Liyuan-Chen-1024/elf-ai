"""Type definitions for the media app."""

from dataclasses import dataclass
from datetime import date
from enum import Enum
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Final,
    List,
    Literal,
    Optional,
    Protocol,
    TypedDict,
    Union,
)

from django.db.models import QuerySet

from .enums import TorrentStatus

if TYPE_CHECKING:
    # Import these only for type checking to avoid circular imports
    from apps.shows.models import MediaFile, TVShow

# Constants
DEFAULT_BATCH_SIZES: Final[List[int]] = [10, 20, 50, 100]
DEFAULT_CACHE_TTL: Final[int] = 3600  # 1 hour in seconds

# Path types
PathLike = Union[str, Path]
DirectoryPath = Path
FilePath = Path

# Show types
SeasonNumber = int
EpisodeNumber = int
ShowName = str
EpguideName = str

# Quality types
QualityPreference = Literal["2160p", "1080p", "720p"]
VideoQuality = Literal["4k", "2160p", "1080p", "720p"]

# Status types
DownloadStatus = Literal["downloading", "seeding", "stopped", "error"]


# API types
class EpisodeDict(TypedDict):
    """Type for episode data from API."""

    season: int
    number: int
    release_date: str
    title: Optional[str]
    description: str


class APIResponse(TypedDict, total=False):
    """Type for API responses."""

    status: bool
    episode: Optional[EpisodeDict]
    error: Optional[str]


# File stats types
class FileStats(TypedDict):
    """Type for file statistics."""

    st_mode: int
    st_uid: int
    st_gid: int
    st_size: int
    st_atime: float
    st_mtime: float
    st_ctime: float


# Database types
TVShowQuerySet = QuerySet["TVShow"]
MediaFileQuerySet = QuerySet["MediaFile"]


# Protocol for file-like objects
class FileProtocol(Protocol):
    """Protocol for file-like objects."""

    def read(self, size: int = -1) -> Union[str, bytes]: ...

    def write(self, data: Union[str, bytes]) -> int: ...

    def close(self) -> None: ...


# Magnet types
class MagnetInfo(TypedDict):
    """Type for magnet link information."""

    url: str
    name: str
    seeds: int
    quality: VideoQuality


# Download types
class DownloadStats(TypedDict):
    """Type for download statistics."""

    speed: float  # bytes per second
    progress: float  # percentage
    eta: Optional[int]  # seconds
    size: int  # bytes
    downloaded: int  # bytes


# Cache types
CacheKey = str
CacheValue = Union[str, int, float, Dict[str, Any], List[Any], None]
CacheTTL = int  # seconds


# Result types
class ProcessingResult(TypedDict):
    """Type for processing results."""

    success: bool
    error: Optional[str]
    data: Optional[Dict[str, Any]]


# Date types
DateRange = tuple[date, date]
OptionalDate = Optional[date]

# Batch processing types
BatchSize = Literal[tuple(DEFAULT_BATCH_SIZES)]  # type: ignore
ProcessingMode = Literal["sequential", "parallel"]


# Configuration types
class LogConfig(TypedDict):
    """Type for logging configuration."""

    level: str
    file: Optional[Path]
    format: str


class APIConfig(TypedDict):
    """Type for API configuration."""

    base_url: str
    timeout: int
    retries: int
    headers: Dict[str, str]


class TorrentInfo(TypedDict):
    """Type definition for torrent information."""

    id: int
    name: str
    status: TorrentStatus
    progress: float
    download_dir: str
    rate_download: int
    error: str


class QueueStats(TypedDict):
    """Type definition for queue statistics."""

    active: int
    completed: int
    failed: int
    total: int


class QueueResult(TypedDict):
    """Type definition for queue management results."""

    processed: int
    removed: int
    retried: int
    errors: int


# Type aliases
TorrentId = Union[int, str]
TorrentIds = Union[TorrentId, List[TorrentId]]
JsonDict = Dict[str, Any]
PathStr = str
DateStr = str
SizeBytes = int
StatusStr = Literal["success", "failed", "error"]


class ShowStatus(str, Enum):
    """Status of a TV show."""

    UNKNOWN = "unknown"
    RUNNING = "running"
    ENDED = "ended"
    CANCELED = "canceled"


class StatusColor(str, Enum):
    """Colors for TV show status display."""

    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    GREY = "grey"


@dataclass
class TorrentData:
    """Data class for torrent information."""

    name: str
    date_added: date
    size_bytes: int
    info_hash: str
    magnet_link: str
    seeders: int
    leechers: int


@dataclass
class MediaData:
    """Data class for media file information."""

    title: str
    year: Optional[int]
    season: Optional[int]
    episode: Optional[int]
    quality: str
    codec: str
    group: str


class ShowFilter(TypedDict, total=False):
    """Type for filtering TV shows."""

    active: bool
    keep: bool
    epguide_name: str
    full_name__contains: str


class FileFilter(TypedDict, total=False):
    """Type for filtering media files."""

    is_movie: bool
    keep: bool
    path__contains: str
    ext: str


class RetrievalResult(TypedDict):
    """Type for show retrieval results."""

    success: bool
    error: Optional[str]
    shows: Optional[List["TVShow"]]
    files: Optional[List["MediaFile"]]


# Type aliases
PathOrStr = Union[Path, str]
ShowDict = Dict[str, Any]
EpisodeDict = Dict[str, Any]
