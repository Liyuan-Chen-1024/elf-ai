"""
URL patterns for the agent tools system.
"""

from django.urls import path

from . import views

app_name = "agent"

urlpatterns = [
    # Tool discovery and schema endpoints
    path("tools/", views.list_tools, name="list_tools"),
    path("tools/<str:tool_name>/", views.get_tool_schema, name="get_tool_schema"),
    # Tool execution endpoints
    path("parse/", views.parse_tool_query, name="parse_tool_query"),
    path("execute/", views.execute_tool, name="execute_tool"),
]
