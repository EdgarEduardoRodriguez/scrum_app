# Estas vistas conectan el frontend con la lógica de autenticación del backend.
# Validan datos con serializers y responden JSON para React.
from datetime import datetime
import logging

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Project
from .serializers import MeSerializer, ProjectSerializer, RegisterSerializer

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
        # Obtener todos los proyectos del usuario autenticado
        projects = Project.objects.filter(owner=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        # Crear un nuevo proyecto
        serializer = ProjectSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def project_detail(request, pk):
    """Obtiene, actualiza o elimina un proyecto específico."""
    
    try:
        project = Project.objects.get(pk=pk, owner=request.user)
    except Project.DoesNotExist:
        return Response({"detail": "Proyecto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == "GET":
        serializer = ProjectSerializer(project)
        return Response(serializer.data)
    
    elif request.method == "PUT":
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == "DELETE":
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
