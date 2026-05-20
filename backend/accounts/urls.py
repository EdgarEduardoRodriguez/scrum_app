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
    path("projects/<int:project_pk>/members/<int:member_id>/", views.update_project_member_role, name="update_project_member_role"),
    path("projects/<int:pk>/users/search/", views.search_users_for_project, name="search_users_for_project"),
    path("projects/<int:project_pk>/tasks/", views.task_list_create, name="task_list_create"),
    path("projects/<int:project_pk>/tasks/<int:task_pk>/", views.task_detail, name="task_detail"),
    path("projects/<int:project_pk>/tasks/<int:task_pk>/log-time/", views.task_log_time, name="task_log_time"),

    # Sprints
    path("projects/<int:project_pk>/sprints/", views.sprint_list_create, name="sprint_list_create"),
    path("projects/<int:project_pk>/sprints/<int:sprint_pk>/", views.sprint_detail, name="sprint_detail"),
    path("projects/<int:project_pk>/sprints/<int:sprint_pk>/tasks/<int:task_pk>/", views.sprint_task_toggle, name="sprint_task_toggle"),

    # Invitations
    path("invitations/", views.my_invitations, name="my_invitations"),
    path("invitations/<int:invitation_id>/respond/", views.respond_invitation, name="respond_invitation"),
]
