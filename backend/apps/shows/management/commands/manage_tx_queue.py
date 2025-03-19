"""Command to manage transmission queue."""

from django.core.management.base import BaseCommand, CommandError

from apps.shows.utils.tx import TXWrapper


class Command(BaseCommand):
    """Command to manage transmission queue."""

    help = """
    Manages the transmission download queue:
    - Checks status of active downloads
    - Removes completed downloads
    - Updates download statistics
    - Handles failed downloads
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--remove-completed",
            action="store_true",
            help="Remove completed downloads from the queue",
        )
        parser.add_argument(
            "--remove-failed",
            action="store_true",
            help="Remove failed downloads from the queue",
        )
        parser.add_argument(
            "--retry-failed",
            action="store_true",
            help="Retry failed downloads",
        )
        parser.add_argument(
            "--quiet",
            action="store_true",
            help="Suppress non-error output",
        )

    def handle(self, *args, **options):
        """Execute the command."""
        quiet = options["quiet"]

        try:
            if not quiet:
                self.stdout.write("Starting transmission queue management...")

            # Get initial queue status
            initial_status = TXWrapper.get_queue_status()
            if not quiet:
                self.stdout.write(
                    f"Initial queue status:"
                    f"\n- Active downloads: {initial_status['active']}"
                    f"\n- Completed downloads: {initial_status['completed']}"
                    f"\n- Failed downloads: {initial_status['failed']}"
                    f"\n- Total torrents: {initial_status['total']}"
                )

            # Process queue with options
            result = TXWrapper.manage_queue(
                remove_completed=options["remove_completed"],
                remove_failed=options["remove_failed"],
                retry_failed=options["retry_failed"],
            )

            # Get final queue status
            final_status = TXWrapper.get_queue_status()

            # Report results
            if not quiet:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"\nQueue management completed successfully:"
                        f"\n- Downloads processed: {result['processed']}"
                        f"\n- Downloads removed: {result['removed']}"
                        f"\n- Downloads retried: {result['retried']}"
                        f"\n\nFinal queue status:"
                        f"\n- Active downloads: {final_status['active']}"
                        f"\n- Completed downloads: {final_status['completed']}"
                        f"\n- Failed downloads: {final_status['failed']}"
                        f"\n- Total torrents: {final_status['total']}"
                    )
                )

            if result["errors"]:
                self.stdout.write(
                    self.style.WARNING(
                        f"\nEncountered {result['errors']} errors during processing"
                    )
                )

        except Exception as e:
            raise CommandError(f"Command failed: {str(e)}")
