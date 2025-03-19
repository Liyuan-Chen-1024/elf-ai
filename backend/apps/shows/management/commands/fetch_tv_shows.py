from apps.core.logging import get_logger
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from tqdm import tqdm

from apps.core.exceptions import ShowNotFoundException
from apps.shows.models import TVShow

logger = get_logger(__name__)


@dataclass
class ProcessResult:
    """Result of processing a TV show."""

    show_name: str
    success: bool
    error_message: Optional[str] = None


class Command(BaseCommand):
    """
    Management command to fetch and download episodes for TV shows.

    This command handles:
    - Processing specific shows or all shows
    - Parallel processing with configurable worker count
    - Progress reporting and error tracking
    - Detailed logging of operations
    """

    help = "Fetch and download episodes for TV shows"

    def add_arguments(self, parser):
        parser.add_argument(
            "--show",
            type=str,
            help="Process specific show by epguide_name",
        )
        parser.add_argument(
            "--active-only",
            action="store_true",
            help="Only process active shows",
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=3,
            help="Number of parallel workers (default: 3)",
        )
        parser.add_argument(
            "--verbose",
            action="store_true",
            help="Enable verbose output",
        )

    def process_show(self, tvshow: TVShow) -> ProcessResult:
        """
        Process a single TV show and return the result.

        Args:
            tvshow: TVShow instance to process

        Returns:
            ProcessResult containing success/failure info and any error message
        """
        try:
            logger.info(f"Processing TV show: {tvshow}")
            tvshow.download_all_available_episodes_starting_at_current_episode()
            return ProcessResult(show_name=tvshow.epguide_name, success=True)
        except ShowNotFoundException:
            msg = f"Show not found: {tvshow.epguide_name}"
            logger.error(msg)
            return ProcessResult(
                show_name=tvshow.epguide_name, success=False, error_message=msg
            )
        except Exception as e:
            msg = f"Error processing {tvshow.epguide_name}: {str(e)}"
            logger.error(msg)
            return ProcessResult(
                show_name=tvshow.epguide_name, success=False, error_message=msg
            )

    def get_shows_to_process(self, options: Dict[str, Any]) -> List[TVShow]:
        """
        Get the list of shows to process based on command options.

        Args:
            options: Command line options dictionary

        Returns:
            List of TVShow instances to process

        Raises:
            CommandError: If no shows match the criteria
        """
        query = Q()
        if options["active_only"]:
            query &= Q(active=True)
        if options["show"]:
            query &= Q(epguide_name=options["show"])

        shows = TVShow.objects.filter(query)
        if not shows.exists():
            raise CommandError("No TV shows found matching the criteria")

        return list(shows)

    def summarize_results(self, results: List[ProcessResult]) -> None:
        """
        Print a summary of processing results.

        Args:
            results: List of ProcessResult instances
        """
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        self.stdout.write("\nProcessing Summary:")
        self.stdout.write(f"Total shows processed: {len(results)}")
        self.stdout.write(f"Successful: {len(successful)}")
        self.stdout.write(f"Failed: {len(failed)}")

        if failed:
            self.stdout.write("\nErrors encountered:")
            for result in failed:
                self.stdout.write(self.style.ERROR(f"- {result.error_message}"))

    def handle(self, *args: Any, **options: Any) -> None:
        """
        Execute the command.

        Args:
            options: Command line options

        Raises:
            CommandError: If command execution fails
        """
        try:
            shows = self.get_shows_to_process(options)
            total_shows = len(shows)

            if options["verbose"]:
                self.stdout.write(f"Found {total_shows} shows to process")
                self.stdout.write(f"Using {options['workers']} workers")

            results: List[ProcessResult] = []

            # Setup progress bar
            progress = tqdm(
                total=total_shows,
                desc="Processing shows",
                unit="show",
                disable=not options["verbose"],
            )

            # Process shows in parallel
            with ThreadPoolExecutor(max_workers=options["workers"]) as executor:
                future_to_show = {
                    executor.submit(self.process_show, show): show for show in shows
                }

                for future in as_completed(future_to_show):
                    result = future.result()
                    results.append(result)

                    if options["verbose"]:
                        status = "✓" if result.success else "✗"
                        progress.set_postfix_str(
                            f"Current: {result.show_name} [{status}]"
                        )
                    progress.update(1)

            progress.close()
            self.summarize_results(results)

            if all(r.success for r in results):
                self.stdout.write(
                    self.style.SUCCESS("\nAll shows processed successfully")
                )
            else:
                self.stdout.write(self.style.WARNING("\nCommand completed with errors"))

        except Exception as e:
            raise CommandError(f"Command failed: {str(e)}")
