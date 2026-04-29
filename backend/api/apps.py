from django.apps import AppConfig
from django.db.backends.signals import connection_created
from django.dispatch import receiver

class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"


