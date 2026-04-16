from django.contrib import admin

from .models import SupportTask


@admin.register(SupportTask)
class SupportTaskAdmin(admin.ModelAdmin):
    list_display = ("date", "details", "province", "district", "organization_name", "status")
    list_filter = ("date", "status", "province", "district")
    search_fields = ("details", "organization_name", "contact_person", "contact_number")
