"""Service layer for TV show operations."""
from datetime import date
from typing import Optional, Tuple, List, Any, Dict, Union
import re 

from bs4 import BeautifulSoup
import requests

from apps.shows.models import TVShow
from apps.shows.typing import (
    EpisodeDict,
    ShowStatus,
    StatusColor,
    MagnetInfo,
    VideoQuality
)
from apps.shows.utils.epguides import get_episode_info, get_show_status, make_api_request
from apps.shows.utils.files import get_tv_folder
from apps.shows.utils.torrent import TorrentClient
from apps.core.exceptions import EpguidesException
from apps.core.logging import get_logger
from apps.core.services import BaseService
from apps.shows.utils.transmission import TXWrapper

logger = get_logger(__name__)


class TVShowService(BaseService):
    """Service for managing TV show operations."""

    def __init__(self, torrent_client: Optional[TorrentClient] = None):
        """Initialize the service with optional torrent client."""
        self.torrent_client = torrent_client or TorrentClient()

    def get_show_status(self, show: TVShow) -> Tuple[ShowStatus, StatusColor]:
        """Get the current status and color for a show."""
        today = date.today()
        
        if (show.next_release_date == show.last_release_date 
            and show.next_release_date < today):
            return "Finished", "gray"
            
        if (show.current_season > show.last_release_season 
            and show.next_release_date > today):
            return "Up to date", "green"
            
        if (show.current_season < show.last_release_season or 
            show.current_episode < show.last_release_episode):
            return "Behind", "red"
            
        if (show.current_episode == show.last_release_episode and
            show.current_season == show.last_release_season and 
            not show.downloaded_current_episode):
            return "Behind", "red"
            
        return "Up to date", "green"

    def find_best_magnet(self, show: TVShow, episode: EpisodeDict) -> Optional[MagnetInfo]:
        """Find the best magnet link for a show episode."""
        search_engine = "https://limetorrents.lol"
        qualities: List[VideoQuality] = ["2160p", "1080p", "720p"]
        
        episode_code = (
            f"S{show.current_season:02d}E{show.current_episode:02d}"
            if show.episode_lookup_type != "date"
            else episode["release_date"]
        )
        
        best_magnet: Optional[MagnetInfo] = None
        max_seeds = 0
        
        for quality in qualities:
            search_term = f"{quality}-{show.full_name.replace(' ', '-')}-{episode_code}"
            url = f"{search_engine}/search/all/{search_term}/seeds/1"
            
            try:
                with requests.Session() as session:
                    content = session.get(url, verify=True).text
                    soup = BeautifulSoup(content, "lxml")
                    
                    for row in soup.find_all("tr", {"bgcolor": re.compile("#F4F4F4|#FFFFFF")})[:5]:
                        seeds = int(row.find("td", {"class": "tdseed"}).text.replace(",", ""))
                        if seeds > max_seeds:
                            magnet_url = self._extract_magnet_url(
                                session, 
                                search_engine + row.find_all("a")[1]["href"]
                            )
                            if magnet_url:
                                best_magnet = MagnetInfo(
                                    url=magnet_url,
                                    name=search_term,
                                    seeds=seeds,
                                    quality=quality
                                )
                                max_seeds = seeds
            except Exception as e:
                logger.warning(f"Error searching {quality} torrent: {str(e)}")
                continue
                
        return best_magnet

    def _extract_magnet_url(self, session: requests.Session, url: str) -> Optional[str]:
        """Extract magnet URL from torrent page."""
        try:
            content = session.get(url, verify=True).text
            soup = BeautifulSoup(content, "lxml")
            for link in soup.find_all("a"):
                if "magnet:" in link["href"]:
                    return link["href"]
        except Exception as e:
            logger.warning(f"Error extracting magnet URL: {str(e)}")
        return None

    def download_current_episode(self, show: TVShow) -> bool:
        """Download the current episode for a show."""
        if not show.active:
            logger.info(f"Skipping {show.full_name}, marked as inactive")
            return False
            
        try:
            episode = get_episode_info(show.epguide_name, show.current_season, show.current_episode)
            if not episode or not get_show_status(show.epguide_name, episode):
                logger.info(f"Skipping {show.full_name}, current episode not released")
                return False
                
            if show.downloaded_current_episode:
                return False
                
            magnet = self.find_best_magnet(show, episode)
            if not magnet:
                logger.info(
                    f"Will skip {show.full_name}, can't find magnet for "
                    f"S{show.current_season:02d}E{show.current_episode:02d}"
                )
                return False
                
            logger.info(
                f"Downloading {show.full_name} "
                f"S{show.current_season:02d}E{show.current_episode:02d}"
            )
            
            download_dir = get_tv_folder(show.keep)
            return self.torrent_client.add_torrent(magnet.url, download_dir)
            
        except EpguidesException as e:
            logger.error(f"Epguides error for {show.full_name}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error downloading {show.full_name}: {str(e)}")
            return False

    def update_show_metadata(self, show: TVShow) -> None:
        """Update show metadata from API."""
        try:
            # Update last episode data
            last_episode = get_episode_info(show.epguide_name, "last")
            if last_episode:
                show.last_release_date = last_episode["release_date"]
                show.last_release_season = last_episode["season"]
                show.last_release_episode = last_episode["number"]
            
            # Update next episode data
            next_episode = get_episode_info(show.epguide_name, "next")
            if next_episode:
                show.next_release_date = next_episode["release_date"]
            
            # Update first episode data if not set
            if not show.first_release_date:
                first_episode = get_episode_info(show.epguide_name, "first")
                if first_episode:
                    show.first_release_date = first_episode["release_date"]
            
            show.save()
            
        except EpguidesException as e:
            logger.error(f"Error updating metadata for {show.full_name}: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error updating {show.full_name}: {str(e)}")

    def download_all_available_episodes(self, tv_show: TVShow) -> None:
        """Download all available episodes for a TV show."""
        self.update_show_metadata(tv_show)

        if not tv_show.active:
            logger.info(f"Skipping {tv_show.full_name}, marked as inactive")
            return

        if not tv_show.current_episode_released():
            logger.info(f"Skipping {tv_show.full_name}, current episode not released")
            return

        if not tv_show.downloaded_current_episode and self.download_current_episode(tv_show):
            tv_show.downloaded_current_episode = True
            tv_show.save(update_fields=["downloaded_current_episode"])

        if tv_show.downloaded_current_episode and tv_show.next_episode_released():
            next_episode = tv_show.get_next_episode()
            if next_episode:
                tv_show.current_season = next_episode["season"]
                tv_show.current_episode = next_episode["episode"]
                tv_show.downloaded_current_episode = False
                tv_show.save(update_fields=["current_season", "current_episode", "downloaded_current_episode"])
                self.download_all_available_episodes(tv_show)

    def _fetch_best_magnet_for_current_episode(self, tv_show: TVShow) -> Optional[str]:
        """Fetch the best magnet link for the current episode."""
        try:
            response = make_api_request(
                f"show/{tv_show.epguide_name}/magnet/{tv_show.current_season}/{tv_show.current_episode}/"
            )
            if response and response.get("magnets"):
                return response["magnets"][0]["magnet"]
        except EpguidesException:
            pass
        return None 