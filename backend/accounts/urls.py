from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.me, name='me'),
    path('profile/', views.profile, name='profile'),
    path('verify/', views.verify_id, name='verify-id'),
    path('unverify/', views.unverify, name='unverify'),
]
