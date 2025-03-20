"""Custom CORS middleware for development."""


class CustomCorsMiddleware:
    """Custom middleware to add CORS headers to all responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origin = request.headers.get("Origin")

        if origin:
            # Use the actual origin instead of wildcard
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Headers"] = ", ".join(
                [
                    "accept",
                    "accept-encoding",
                    "authorization",
                    "content-type",
                    "dnt",
                    "origin",
                    "user-agent",
                    "x-csrftoken",
                    "x-requested-with",
                    "cache-control",
                    "last-event-id",
                    "pragma",
                    "sec-fetch-dest",
                    "sec-fetch-mode",
                    "sec-fetch-site",
                ]
            )
            response["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Expose-Headers"] = ", ".join(
                [
                    "content-type",
                    "content-encoding",
                    "content-length",
                    "cache-control",
                ]
            )
            # Add this header to support CORS with cookies
            response["Vary"] = "Origin"

            # Add SSE-specific headers if this is an SSE response
            if response.get("Content-Type") == "text/event-stream":
                response["Cache-Control"] = "no-cache"
                # Remove Connection: keep-alive as it's a hop-by-hop header
                if "Connection" in response:
                    del response["Connection"]
                response["X-Accel-Buffering"] = "no"

        return response
