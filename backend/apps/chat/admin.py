from django.contrib import admin
from django.db.models import Count
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    fields = ("role", "content", "created_at")
    readonly_fields = ("created_at",)
    extra = 0
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class ChatAdminSite(admin.AdminSite):
    site_header = "AI Chat Administration"
    site_title = "AI Chat Admin Portal"
    index_title = "Welcome to AI Chat Admin Portal"


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "user",
        "created_at",
        "updated_at",
        "message_count",
    )
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "user__username")
    readonly_fields = ("created_at", "updated_at")
    inlines = [MessageInline]
    date_hierarchy = "created_at"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "dashboard/",
                self.admin_site.admin_view(self.dashboard_view),
                name="chat_dashboard",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["dashboard_url"] = reverse("admin:chat_dashboard")
        return super().changelist_view(request, extra_context=extra_context)

    def dashboard_view(self, request):
        # Get statistics
        total_conversations = Conversation.objects.count()
        active_conversations = Conversation.objects.filter().count()
        total_messages = Message.objects.count()
        active_messages = Message.objects.filter().count()

        # Messages by role
        messages_by_role = (
            Message.objects.filter()
            .values("role")
            .annotate(count=Count("id"))
            .order_by("role")
        )

        # Recent conversations
        recent_conversations = Conversation.objects.filter().order_by(
            "-updated_at"
        )[:10]

        # Messages per day (last 7 days)
        last_7_days = timezone.now() - timezone.timedelta(days=7)
        messages_per_day = (
            Message.objects.filter(created_at__gte=last_7_days)
            .extra({"day": "date(created_at)"})
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        context = {
            "title": "Chat Dashboard",
            "total_conversations": total_conversations,
            "active_conversations": active_conversations,
            "total_messages": total_messages,
            "active_messages": active_messages,
            "messages_by_role": messages_by_role,
            "recent_conversations": recent_conversations,
            "messages_per_day": messages_per_day,
            "opts": self.model._meta,
        }

        return TemplateResponse(request, "admin/chat/dashboard.html", context)

    def message_count(self, obj):
        return obj.messages.filter().count()

    message_count.short_description = "Messages"

    def archive_conversations(self, request, queryset):
        updated = queryset.update()
        self.message_user(request, f"{updated} conversations archived.")

    archive_conversations.short_description = "Archive selected conversations"

    def unarchive_conversations(self, request, queryset):
        updated = queryset.update()
        self.message_user(request, f"{updated} conversations unarchived.")

    unarchive_conversations.short_description = "Unarchive selected conversations"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "conversation_link",
        "role_badge",
        "short_content",
        "created_at",
    )
    list_filter = ("role", "created_at")
    search_fields = ("content", "conversation__title")
    readonly_fields = (
        "created_at",
        "updated_at",
        "conversation",
    )
    date_hierarchy = "created_at"
    actions = ["mark_as_deleted", "restore_messages"]

    def conversation_link(self, obj):
        url = f"/admin/chat/conversation/{obj.conversation.id}/change/"
        return format_html('<a href="{}">{}</a>', url, obj.conversation.title)

    conversation_link.short_description = "Conversation"

    def role_badge(self, obj):
        colors = {
            "user": "#6e56cf",  # Purple
            "agent": "#10a37f",  # Green
            "system": "#f97316",  # Orange
        }
        color = colors.get(obj.role, "#6b7280")  # Default gray
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 10px; font-size: 0.8em;">{}</span>',
            color,
            obj.get_role_display(),
        )

    role_badge.short_description = "Role"

    def short_content(self, obj):
        max_length = 50
        content = obj.content
        if len(content) > max_length:
            return f"{content[:max_length]}..."
        return content

    short_content.short_description = "Content"
