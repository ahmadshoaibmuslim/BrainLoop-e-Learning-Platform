from django.contrib import admin

from api import models

# Register your models here.
from .models import LearningModule

@admin.register(LearningModule)
class LearningModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_approved')
    list_filter = ('is_approved',)
    actions = ['approve_selected']

    def approve_selected(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, "Selected modules approved successfully.")

    approve_selected.short_description = "Approve selected learning modules"
admin.site.register(models.Test)

admin.site.register(models.Teacher)
admin.site.register(models.Category)
admin.site.register(models.Course)
admin.site.register(models.Variant)
admin.site.register(models.VariantItem)
admin.site.register(models.Question_Answer)
admin.site.register(models.Question_Answer_Message)
admin.site.register(models.Cart)
admin.site.register(models.CartOrder)
admin.site.register(models.CartOrderItem)
admin.site.register(models.Certificate)
admin.site.register(models.CompletedLesson)
admin.site.register(models.EnrolledCourse)
admin.site.register(models.Note)
admin.site.register(models.Review)
admin.site.register(models.Notification)
admin.site.register(models.Coupon)
admin.site.register(models.WishList)
admin.site.register(models.Country)
admin.site.register(models.MentoringSession)
admin.site.register(models.Book)
admin.site.register(models.BookPurchase)
# admin.site.register(models.MentoringSession)