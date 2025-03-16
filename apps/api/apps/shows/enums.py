from enum import Enum


class TorrentStatus(str, Enum):
    """Enum for torrent status."""
    DOWNLOADING = "downloading"
    SEEDING = "seeding"
    STOPPED = "stopped"
    ERROR = "error"


class ShowStatus(str, Enum):
    """Enum for TV show status."""
    FINISHED = "Finished"
    UP_TO_DATE = "Up to date"
    BEHIND = "Behind"


class StatusColor(str, Enum):
    """Enum for status colors."""
    GRAY = "gray"
    GREEN = "green"
    RED = "red" 