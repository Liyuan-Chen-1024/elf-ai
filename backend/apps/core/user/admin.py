from django.contrib import admin

from .models import UserKnowledgeBase


class UserKnowledgeBaseAdmin(admin.ModelAdmin):
    """Admin interface for UserKnowledgeBase model."""

    list_display = ("user", "knowledge_version", "version", "updated_at")
    list_filter = ("knowledge_version", "updated_at")
    search_fields = ("user__username", "user__email", "knowledge_text")
    readonly_fields = ("created_at", "updated_at", "id")
    fieldsets = (
        (None, {"fields": ("user", "id", "created_at", "updated_at")}),
        (
            "Knowledge",
            {
                "fields": ("knowledge_text",),
                "description": "User knowledge in markdown format",
                "classes": ("wide",),
            },
        ),
        (
            "Structured Data",
            {
                "fields": ("topics",),
                "description": "Structured information extracted from conversations",
                "classes": ("wide",),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("knowledge_version", "version", "last_analyzed_message_id"),
                "description": "Technical metadata about the knowledge base",
                "classes": ("wide",),
            },
        ),
    )

    class Media:
        css = {"all": ("admin/css/forms.css",)}

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["knowledge_text"].widget.attrs[
            "style"
        ] = "width: 90%; height: 300px;"
        form.base_fields["topics"].widget.attrs["style"] = "width: 90%; height: 150px;"
        return form


admin.site.register(UserKnowledgeBase, UserKnowledgeBaseAdmin)
