"""Custom content negotiation."""
from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.renderers import BaseRenderer


class EventStreamRenderer(BaseRenderer):
    """A renderer for Server-Sent Events."""
    
    media_type = 'text/event-stream'
    format = 'text-event-stream'
    charset = 'utf-8'
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """Simply pass through the data unchanged."""
        return data


class SSEContentNegotiation(DefaultContentNegotiation):
    """Custom content negotiation that handles text/event-stream content type."""
    
    def select_renderer(self, request, renderers, format_suffix=None):
        """
        Override to handle streaming responses with text/event-stream content type.
        """
        # First, check if this is a streaming view by looking at the accept header
        accepts = self.get_accept_list(request)
        if 'text/event-stream' in accepts:
            # If client accepts text/event-stream, use our custom renderer
            for renderer in renderers:
                if renderer.media_type == 'text/event-stream':
                    return renderer, renderer.media_type
            
            # If no text/event-stream renderer is available but client expects it,
            # add it dynamically
            event_stream_renderer = EventStreamRenderer()
            return event_stream_renderer, event_stream_renderer.media_type
        
        # Otherwise, use default behavior
        return super().select_renderer(request, renderers, format_suffix) 