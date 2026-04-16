# Estas vistas conectan el frontend con la lógica de autenticación del backend.
# Validan datos con serializers y responden JSON para React.
from datetime import datetime
import logging

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import MeSerializer, RegisterSerializer

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

# Create your views here.
