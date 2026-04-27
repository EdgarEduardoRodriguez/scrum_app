from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views


# Rutas específicas del módulo de autenticación/cuenta.
# Estas rutas se montan bajo /api/auth/ desde config/urls.py.

urlpatterns = [
    # Salud del backend
    path("health/", views.health, name="health"),

    # Auth
    path("register/", views.register, name="register"),
    path("login/", views.LoggingTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", views.logout, name="logout"),
    path("me/", views.me, name="me"),

    # Projects
    path("projects/", views.project_list_create, name="project_list_create"),
    path("projects/<int:pk>/", views.project_detail, name="project_detail"),
    path("projects/<int:pk>/members/", views.add_project_member, name="add_project_member"),
    path("projects/<int:pk>/users/search/", views.search_users_for_project, name="search_users_for_project"),

    # Invitations
    path("invitations/", views.my_invitations, name="my_invitations"),
    path("invitations/<int:invitation_id>/respond/", views.respond_invitation, name="respond_invitation"),
]
