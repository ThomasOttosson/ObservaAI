from django.db import models

from django.contrib.auth.models import User


class Analysis(models.Model):
    prompt = models.TextField()
    response = models.TextField()

    favorite = models.BooleanField(default=False)

    architecture_score = models.IntegerField(null=True, blank=True)

    security_score = models.IntegerField(null=True, blank=True)

    performance_score = models.IntegerField(null=True, blank=True)

    production_score = models.IntegerField(null=True, blank=True)

    files_count = models.IntegerField(default=0)

    lines_of_code = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    response_time = models.FloatField(
        null=True,
        blank=True,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.prompt[:50]
