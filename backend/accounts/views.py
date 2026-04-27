# Estas vistas conectan el frontend con la lógica de autenticación del backend.
# Validan datos con serializers y responden JSON para React.
from datetime import datetime
import logging

from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Project, ProjectInvitation, ProjectMember
from .serializers import (
    AddMemberSerializer,
    MeSerializer,
    ProjectInvitationSerializer,
    ProjectSerializer,
    RegisterSerializer,
)

logger = logging.getLogger(__name__)


class LoggingTokenObtainPairView(TokenObtainPairView):
    """Extiende TokenObtainPairView para loggear payloads de login y ayudar a depurar 401."""

    def post(self, request, *args, **kwargs):
        try:
            # Registramos el payload recibido para facilitar depuración en login.
            logger.info("Login payload: %s", request.data)
        except Exception:
            logger.exception("Failed to log login payload")
        # Ejecutamos la lógica JWT original (genera access + refresh si credenciales válidas).
        response = super().post(request, *args, **kwargs)
        if response.status_code == 401:
            logger.warning("Login failed for payload: %s", request.data)
        return response


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    """Endpoint simple para verificar que el backend está vivo."""

    return Response({"status": "ok", "time": datetime.utcnow().isoformat()})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    """Registro de usuario.

    Espera:
    {
      "name": "...",
      "last_name": "...",
      "email": "...",
      "password": "..."
    }
    """

    # Validamos y creamos usuario a través del serializer de registro.
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    # Devolvemos información básica del usuario recién creado.
    return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def logout(request):
    """Logout para JWT.

    En JWT no existe un logout real del lado del servidor.
    Lo normal es que el frontend borre los tokens.

    Si quieres blacklist de refresh tokens, se puede agregar después.
    """

    # Si el frontend manda refresh, intentamos invalidarlo usando blacklist.
    refresh = request.data.get("refresh")
    if refresh:
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            # Si falla (token inválido, etc.) regresamos 400
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "Logged out"}, status=status.HTTP_200_OK)


@api_view(["GET"])
def me(request):
    """Regresa info del usuario autenticado."""

    # request.user viene resuelto por JWTAuthentication (DRF).
    return Response(MeSerializer(request.user).data)


# ------------------------------
# Project API Views
# ------------------------------

@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def project_list_create(request):
    """Lista proyectos del usuario o crea un nuevo proyecto."""
    
    if request.method == "GET":
        # Obtener proyectos donde el usuario es miembro
        projects = Project.objects.filter(members__user=request.user).distinct()
        serializer = ProjectSerializer(projects, many=True, context={"request": request})
        return Response(serializer.data)
    
    elif request.method == "POST":
        # Crear un nuevo proyecto
        serializer = ProjectSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def project_detail(request, pk):
    """Obtiene, actualiza o elimina un proyecto específico."""
    
    try:
        project = Project.objects.get(pk=pk, members__user=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = ProjectSerializer(project, context={"request": request})
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = ProjectSerializer(project, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        # Solo Scrum Master puede eliminar
        membership = ProjectMember.objects.filter(project=project, user=request.user).first()
        if not membership or membership.role != "Scrum Master":
            return Response({"detail": "Solo Scrum Master puede eliminar el proyecto"}, status=status.HTTP_403_FORBIDDEN)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def add_project_member(request, pk):
    """Crea invitación de miembro al proyecto (solo Scrum Master)."""

    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not current_membership or current_membership.role != "Scrum Master":
        return Response({"detail": "Solo Scrum Master puede agregar miembros"}, status=status.HTTP_403_FORBIDDEN)

    serializer = AddMemberSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data["user_id"]
    role = serializer.validated_data["role"]

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    existing_member = ProjectMember.objects.filter(project=project, user=user).first()
    if existing_member:
        return Response({"detail": "El usuario ya pertenece al proyecto"}, status=status.HTTP_400_BAD_REQUEST)

    invitation, created = ProjectInvitation.objects.get_or_create(
        project=project,
        invited_user=user,
        status="pending",
        defaults={
            "invited_by": request.user,
            "role": role,
            "is_read": False,
        }
    )

    if not created:
        invitation.role = role
        invitation.invited_by = request.user
        invitation.is_read = False
        invitation.save()

    return Response(ProjectInvitationSerializer(invitation).data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def search_users_for_project(request, pk):
    """Busca usuarios para invitar a un proyecto (solo Scrum Master)."""

    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not current_membership or current_membership.role != "Scrum Master":
        return Response({"detail": "Solo Scrum Master puede buscar/invitar miembros"}, status=status.HTTP_403_FORBIDDEN)

    q = (request.query_params.get("q") or "").strip()
    if len(q) < 2:
        return Response([])

    member_user_ids = ProjectMember.objects.filter(project=project).values_list("user_id", flat=True)
    invited_user_ids = ProjectInvitation.objects.filter(project=project, status="pending").values_list("invited_user_id", flat=True)

    users = (
        User.objects
        .filter(
            Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(email__icontains=q)
            | Q(username__icontains=q)
        )
        .exclude(id__in=member_user_ids)
        .exclude(id__in=invited_user_ids)
        .order_by("first_name", "last_name")[:20]
    )

    return Response(MeSerializer(users, many=True).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_invitations(request):
    """Lista invitaciones del usuario autenticado."""

    invitations = ProjectInvitation.objects.filter(invited_user=request.user).order_by("-created_at")
    return Response(ProjectInvitationSerializer(invitations, many=True).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def respond_invitation(request, invitation_id):
    """Acepta o rechaza una invitación."""

    action = (request.data.get("action") or "").strip().lower()
    if action not in {"accept", "reject"}:
        return Response({"detail": "Acción inválida. Usa 'accept' o 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        invitation = ProjectInvitation.objects.get(id=invitation_id, invited_user=request.user)
    except ProjectInvitation.DoesNotExist:
        return Response({"detail": "Invitación no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if invitation.status != "pending":
        return Response({"detail": "La invitación ya fue respondida"}, status=status.HTTP_400_BAD_REQUEST)

    if action == "accept":
        ProjectMember.objects.get_or_create(
            project=invitation.project,
            user=request.user,
            defaults={"role": invitation.role},
        )
        invitation.status = "accepted"
    else:
        invitation.status = "rejected"

    invitation.responded_at = timezone.now()
    invitation.is_read = True
    invitation.save()

    return Response(ProjectInvitationSerializer(invitation).data)
