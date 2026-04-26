from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Project


# Serializer para proyectos
class ProjectSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Project."""

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "role",
            "sprint_count",
            "tasks_total",
            "tasks_completed",
            "created_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "sprint_count", "tasks_total", "tasks_completed"]

    # Campos calculados (no se guardan en BD, se calculan al vuelo)
    sprint_count = serializers.SerializerMethodField()
    tasks_total = serializers.SerializerMethodField()
    tasks_completed = serializers.SerializerMethodField()

    def get_sprint_count(self, obj):
        # Por ahora devolvemos 0, ya que no hay modelo de Sprint todavía
        return getattr(obj, "_sprint_count", 0)

    def get_tasks_total(self, obj):
        return getattr(obj, "_tasks_total", 0)

    def get_tasks_completed(self, obj):
        return getattr(obj, "_tasks_completed", 0)

    def create(self, validated_data):
        # Asignar el propietario al proyecto desde el usuario autenticado
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


# Serializer para validar y crear usuarios desde el endpoint de registro.
class RegisterSerializer(serializers.Serializer):
    """Serializer para registrar usuarios.

    En el frontend tú pides: nombre, correo, contraseña.
    Django necesita un `username`, así que por ahora usaremos el correo como username.
    """

    name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=4)

    def validate_email(self, value):
        # Evitamos duplicados revisando tanto username como email.
        if User.objects.filter(username=value).exists() or User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese correo")
        return value

    def create(self, validated_data):
        # Usamos email como username (simple, para no complicar el registro todavía)
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["name"],
            last_name=validated_data["last_name"],
        )
        return user


# Serializer de lectura para devolver datos básicos del usuario autenticado.
class MeSerializer(serializers.ModelSerializer):
    """Serializer para regresar datos básicos del usuario autenticado."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")
