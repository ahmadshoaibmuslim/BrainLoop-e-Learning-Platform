from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LearningModule, Teacher
from userauths.models import User, Profile

@receiver(post_save, sender=LearningModule)
def create_teacher_on_approval(sender, instance, created, update_fields, **kwargs):
    """
    When a LearningModule is approved, create a Teacher profile for that user if it doesn't exist.
    This allows the user to access the instructor dashboard.
    """
    if instance.is_approved:
        # Check if Teacher profile already exists
        if not Teacher.objects.filter(user=instance.user).exists():
            # Create Teacher profile
            teacher = Teacher.objects.create(
                user=instance.user,
                full_name=instance.user.full_name or instance.user.username,
                bio="",
            )
            print(f"✅ Teacher profile created for user: {instance.user.email}")
        else:
            print(f"✅ Teacher profile already exists for user: {instance.user.email}")
