from django.db import models
from django.utils import timezone


class SupportTask(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ONGOING = "ongoing"
    STATUS_RESOLVED = "resolved"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ONGOING, "Ongoing"),
        (STATUS_RESOLVED, "Resolved"),
    ]

    date = models.DateField()
    province = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    municipality = models.CharField(max_length=255)
    details = models.TextField()
    organization_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    started_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)
    elapsed_seconds_override = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.details} - {self.organization_name}"

    @property
    def elapsed_seconds(self):
        if self.status == self.STATUS_RESOLVED and self.resolved_at:
            return self.elapsed_seconds_override
        return self.elapsed_seconds_override + max(0, int((timezone.now() - self.started_at).total_seconds()))

    def apply_status_transition(self, next_status):
        current_time = timezone.now()
        if next_status == self.STATUS_RESOLVED:
            self.elapsed_seconds_override = self.elapsed_seconds
            self.resolved_at = current_time
        elif self.status == self.STATUS_RESOLVED and next_status in {self.STATUS_PENDING, self.STATUS_ONGOING}:
            self.started_at = current_time
            self.resolved_at = None
        elif self.status == self.STATUS_PENDING and next_status == self.STATUS_ONGOING:
            self.started_at = current_time
        self.status = next_status
