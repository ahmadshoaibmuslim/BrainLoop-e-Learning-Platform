from django.urls import path

from .views import ChatApiView

urlpatterns = [
    path('', ChatApiView.as_view(), name='chat'),
]
