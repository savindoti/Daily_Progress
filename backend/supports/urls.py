from django.urls import path

from .views import (
    ExportSupportsView,
    SupportSummaryView,
    SupportTaskListCreateView,
    SupportTaskStatusView,
    YesterdaySupportView,
    SupportTaskDetailView,
)


urlpatterns = [
    path("supports/", SupportTaskListCreateView.as_view(), name="support-list-create"),
    path("supports/yesterday/", YesterdaySupportView.as_view(), name="support-yesterday"),
    path("supports/summary/", SupportSummaryView.as_view(), name="support-summary"),
    path("supports/export/", ExportSupportsView.as_view(), name="support-export"),
    path("supports/<int:pk>/", SupportTaskDetailView.as_view(), name="support-detail"),
    path("supports/<int:pk>/status/", SupportTaskStatusView.as_view(), name="support-status"),
]
