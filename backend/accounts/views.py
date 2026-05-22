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
from .models import Project, ProjectInvitation, ProjectMember, Sprint, SprintTask, Task, TimeEntry

from .ai_service import calculate_sprint_dates_sequence, generate_multi_sprint
from .serializers import (
    AddMemberSerializer,
    MeSerializer,
    ProjectInvitationSerializer,
    ProjectSerializer,
    RegisterSerializer,
    SprintSerializer,
    TaskSerializer,
    TimeEntrySerializer,
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
        # Solo Scrum Master puede eliminar el proyecto
        current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
        if not current_membership or current_membership.role != "Scrum Master":
            return Response(
                {"detail": "Solo el Scrum Master puede eliminar el proyecto"},
                status=status.HTTP_403_FORBIDDEN,
            )
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_project_member(request, pk):
    """Crea invitación de miembro al proyecto (solo Scrum Master)."""
    
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'detail': 'Proyecto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not current_membership or current_membership.role != 'Scrum Master':
        return Response({'detail': 'Solo Scrum Master puede agregar miembros'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AddMemberSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data['user_id']
    role = serializer.validated_data['role']

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    existing_member = ProjectMember.objects.filter(project=project, user=user).first()
    if existing_member:
        return Response({'detail': 'El usuario ya pertenece al proyecto'}, status=status.HTTP_400_BAD_REQUEST)

    invitation, created = ProjectInvitation.objects.get_or_create(
        project=project,
        invited_user=user,
        status='pending',
        defaults={
            'invited_by': request.user,
            'role': role,
            'is_read': False,
        }
    )

    if not created:
        invitation.role = role
        invitation.invited_by = request.user
        invitation.is_read = False
        invitation.save()

    return Response(ProjectInvitationSerializer(invitation).data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_project_member_role(request, project_pk, member_id):
    """Actualiza el rol de un miembro del proyecto (solo Scrum Master)."""
    try:
        project = Project.objects.get(pk=project_pk)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not current_membership or current_membership.role != "Scrum Master":
        return Response({"detail": "Solo Scrum Master puede cambiar roles de miembros"}, status=status.HTTP_403_FORBIDDEN)

    try:
        member = ProjectMember.objects.get(pk=member_id, project=project)
    except ProjectMember.DoesNotExist:
        return Response({"detail": "Miembro no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    role = request.data.get("role")
    if not role:
        return Response({"detail": "El campo 'role' es requerido"}, status=status.HTTP_400_BAD_REQUEST)

    allowed_roles = [choice[0] for choice in ProjectMember.ROLES]
    if role not in allowed_roles:
        return Response({"detail": f"Rol no válido. Opciones: {', '.join(allowed_roles)}"}, status=status.HTTP_400_BAD_REQUEST)

    member.role = role
    member.save()

    return Response({
        "id": member.id,
        "user_id": member.user.id,
        "first_name": member.user.first_name,
        "last_name": member.user.last_name,
        "email": member.user.email,
        "role": member.role,
        "joined_at": member.joined_at.isoformat() if member.joined_at else None,
    }, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
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

@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def task_list_create(request, project_pk):
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def task_detail(request, project_pk, task_pk):
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
        task = Task.objects.get(pk=task_pk, project=project)
    except (Project.DoesNotExist, Task.DoesNotExist):
        return Response({"detail": "Tarea no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    elif request.method == "PATCH":
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def task_log_time(request, project_pk, task_pk):
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
        task = Task.objects.get(pk=task_pk, project=project)
    except (Project.DoesNotExist, Task.DoesNotExist):
        return Response({"detail": "Tarea no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    serializer = TimeEntrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------
# Sprint API Views
# ------------------------------

@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def sprint_list_create(request, project_pk):
    """Lista sprints de un proyecto o crea un nuevo sprint."""
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        sprints = Sprint.objects.filter(project=project)
        serializer = SprintSerializer(sprints, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = SprintSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def sprint_detail(request, project_pk, sprint_pk):
    """Obtiene, actualiza o elimina un sprint específico."""
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
        sprint = Sprint.objects.get(pk=sprint_pk, project=project)
    except (Project.DoesNotExist, Sprint.DoesNotExist):
        return Response({"detail": "Sprint no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = SprintSerializer(sprint)
        return Response(serializer.data)

    elif request.method == "PATCH":
        serializer = SprintSerializer(sprint, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        sprint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def sprint_task_toggle(request, project_pk, sprint_pk, task_pk):
    """Agrega o quita una tarea de un sprint."""
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
        sprint = Sprint.objects.get(pk=sprint_pk, project=project)
        task = Task.objects.get(pk=task_pk, project=project)
    except (Project.DoesNotExist, Sprint.DoesNotExist, Task.DoesNotExist):
        return Response({"detail": "Sprint o tarea no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "POST":
        _, created = SprintTask.objects.get_or_create(sprint=sprint, task=task)
        if created:
            serializer = SprintSerializer(sprint)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({"detail": "La tarea ya está en el sprint"}, status=status.HTTP_200_OK)

    elif request.method == "DELETE":
        deleted, _ = SprintTask.objects.filter(sprint=sprint, task=task).delete()
        if deleted:
            serializer = SprintSerializer(sprint)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"detail": "La tarea no está en el sprint"}, status=status.HTTP_404_NOT_FOUND)


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


# ------------------------------
# AI Sprint Generation
# ------------------------------

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def ai_generate_sprint(request, project_pk):
    """
    Genera MÚLTIPLES SPRINTS automáticamente usando IA.
    
    La IA/ algoritmo analiza:
    - El product backlog completo
    - Los miembros del equipo con sus roles
    - La capacidad del equipo
    
    Y genera varios sprints, cada uno con su objetivo y tareas asignadas.
    El backlog se divide en sprints sucesivos según la capacidad del equipo.
    """
    try:
        project = Project.objects.get(pk=project_pk, members__user=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    # Verificar permisos
    current_membership = ProjectMember.objects.filter(project=project, user=request.user).first()
    if not current_membership or current_membership.role not in ("Scrum Master", "Product Owner"):
        return Response(
            {"detail": "Solo Scrum Master o Product Owner pueden generar sprints con IA"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Obtener miembros del proyecto
    members = ProjectMember.objects.filter(project=project).select_related("user")

    # Obtener tareas del backlog (sin sprint asignado)
    tasks_in_sprints = SprintTask.objects.filter(sprint__project=project).values_list("task_id", flat=True)
    backlog_tasks = Task.objects.filter(project=project).exclude(id__in=tasks_in_sprints)

    if not backlog_tasks.exists():
        return Response(
            {"detail": "No hay tareas en el product backlog para generar sprints"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Contar sprints anteriores
    sprint_count = Sprint.objects.filter(project=project).count()

    # Llamar al generador de múltiples sprints
    logger.info(f"Generando múltiples sprints con IA para proyecto {project.id}")
    ai_result = generate_multi_sprint(project, members, backlog_tasks, sprint_count)

    if ai_result is None or "sprints" not in ai_result:
        return Response(
            {"detail": "Error al generar los sprints con IA."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ── Crear los sprints en la BD ────────────────────────────────
    created_sprints = []
    total_tasks_assigned = 0

    for idx, sprint_data in enumerate(ai_result.get("sprints", [])):
        # Calcular fechas secuenciales para cada sprint
        start_date, end_date = calculate_sprint_dates_sequence(
            sprint_index=idx,
            duration_weeks=sprint_data.get("duration_weeks", 2),
        )

        # Crear el sprint con descripción
        sprint = Sprint.objects.create(
            project=project,
            name=sprint_data.get("sprint_name", f"Sprint {sprint_count + idx + 1}"),
            goal=sprint_data.get("goal", ""),
            description=sprint_data.get("description", ""),
            start_date=start_date,
            end_date=end_date,
            status="Planificando",
        )

        # Asignar tareas al sprint
        sprint_task_count = 0
        for task_data in sprint_data.get("assigned_tasks", []):
            task_id = task_data.get("task_id")
            assigned_to_user_id = task_data.get("assigned_to_user_id")
            order = task_data.get("order", 0)

            try:
                task = Task.objects.get(id=task_id, project=project)
                # Verificar que la tarea no esté ya en otro sprint
                if not SprintTask.objects.filter(task=task).exists():
                    SprintTask.objects.create(sprint=sprint, task=task, order=order)
                    if assigned_to_user_id:
                        task.assignee = assigned_to_user_id
                        task.save()
                    sprint_task_count += 1
            except Task.DoesNotExist:
                logger.warning(f"Tarea {task_id} no encontrada en proyecto {project.id}")
                continue

        total_tasks_assigned += sprint_task_count
        serializer = SprintSerializer(sprint)
        created_sprints.append(serializer.data)

    source = ai_result.get("_source", "unknown")

    return Response({
        "sprints": created_sprints,
        "sprints_count": len(created_sprints),
        "total_tasks_assigned": total_tasks_assigned,
        "ai_reasoning": ai_result.get("reasoning", ""),
        "remaining_backlog": ai_result.get("remaining_backlog_ids", []),
        "message": (
            f"Se generaron {len(created_sprints)} sprints "
            f"con {total_tasks_assigned} tareas asignadas en total. "
            f"Fuente: {source}."
        ),
    }, status=status.HTTP_201_CREATED)
