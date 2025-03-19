"""Command to add new epguides shows."""

from django.core.management.base import BaseCommand

from apps.shows.utils.epguides_utils import find_and_process_new_epguide_keys


class Command(BaseCommand):
    """Command to add new epguides shows."""

    help = "Add new epguides shows"

    def add_arguments(self, parser):
        parser.add_argument(
            "--activate",
            action="store_true",
            help="Automatically activate newly added shows",
        )
        parser.add_argument(
            "--delay",
            type=int,
            default=5,
            help="Delay between API requests in seconds (default: 5)",
        )

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write("Starting to fetch new TV shows from epguides.com...")

        total_processed, successful_count, errors = find_and_process_new_epguide_keys(
            delay=options["delay"]
        )

        # Report results
        if successful_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nSuccessfully processed {successful_count} out of {total_processed} shows"
                )
            )

        if errors:
            self.stdout.write(
                self.style.WARNING(f"\nEncountered {len(errors)} errors:")
            )
            for error in errors:
                self.stdout.write(self.style.WARNING(f"- {error}"))

        if successful_count == 0 and not errors:
            self.stdout.write(self.style.SUCCESS("\nNo new shows to process"))
