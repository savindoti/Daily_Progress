from datetime import datetime, timedelta
from io import BytesIO

from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SupportTask
from .serializers import StatusUpdateSerializer, SupportTaskSerializer


def format_elapsed_seconds(total_seconds):
    seconds = max(0, int(total_seconds))
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}:{secs:02}"


class SupportTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = SupportTaskSerializer

    def get_queryset(self):
        queryset = SupportTask.objects.all()
        selected_date = self.request.query_params.get("date")
        if selected_date:
            queryset = queryset.filter(date=selected_date)
        return queryset.order_by("created_at")


class YesterdaySupportView(generics.ListAPIView):
    serializer_class = SupportTaskSerializer

    def get_queryset(self):
        selected_date = self.request.query_params.get("date")
        base_date = datetime.strptime(selected_date, "%Y-%m-%d").date() if selected_date else timezone.localdate()
        return SupportTask.objects.filter(date=base_date - timedelta(days=1)).order_by("created_at")


class SupportSummaryView(APIView):
    def get(self, request):
        selected_date = request.query_params.get("date")
        queryset = SupportTask.objects.all()
        if selected_date:
            queryset = queryset.filter(date=selected_date)
        status_counts = {item["status"]: item["total"] for item in queryset.values("status").annotate(total=Count("id"))}
        return Response(
            {
                "total_count": queryset.count(),
                "pending_count": status_counts.get(SupportTask.STATUS_PENDING, 0),
                "ongoing_count": status_counts.get(SupportTask.STATUS_ONGOING, 0),
                "resolved_count": status_counts.get(SupportTask.STATUS_RESOLVED, 0),
            }
        )


class SupportTaskStatusView(APIView):
    def patch(self, request, pk):
        support = generics.get_object_or_404(SupportTask, pk=pk)
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        support.apply_status_transition(serializer.validated_data["status"])
        support.save()
        return Response(SupportTaskSerializer(support).data)


class SupportTaskDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a SupportTask instance."""
    serializer_class = SupportTaskSerializer
    queryset = SupportTask.objects.all()


class ExportSupportsView(APIView):
    def get(self, request):
        selected_date = request.query_params.get("date")
        queryset = SupportTask.objects.all().order_by("date", "created_at")
        if selected_date:
            queryset = queryset.filter(date=selected_date)

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Support Report"
        sheet.append(
            [
                "S.N.",
                "Date",
                "Province",
                "District",
                "Municipality",
                "Details",
                "Organization Name",
                "Contact Person",
                "Contact Number",
                "Status",
                "Elapsed Time",
            ]
        )

        for index, support in enumerate(queryset, start=1):
            sheet.append(
                [
                    index,
                    support.date.isoformat(),
                    support.province,
                    support.district,
                    support.municipality,
                    support.details,
                    support.organization_name,
                    support.contact_person,
                    support.contact_number,
                    support.get_status_display(),
                    format_elapsed_seconds(support.elapsed_seconds),
                ]
            )

        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        filename = "support-report-all.xlsx" if not selected_date else f"support-report-{selected_date}.xlsx"
        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
