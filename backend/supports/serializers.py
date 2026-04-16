from rest_framework import serializers

from .models import SupportTask


class SupportTaskSerializer(serializers.ModelSerializer):
    elapsed_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = SupportTask
        fields = [
            "id",
            "date",
            "province",
            "district",
            "municipality",
            "details",
            "organization_name",
            "contact_person",
            "contact_number",
            "status",
            "started_at",
            "resolved_at",
            "elapsed_seconds",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "started_at",
            "resolved_at",
            "elapsed_seconds",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        task = SupportTask(**validated_data)
        task.status = SupportTask.STATUS_PENDING
        task.save()
        return task


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=SupportTask.STATUS_CHOICES)
