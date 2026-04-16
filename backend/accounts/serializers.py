from django.contrib.auth.models import User
from rest_framework import serializers


# Serializer para validar y crear usuarios desde el endpoint de registro.
class RegisterSerializer(serializers.Serializer):
    """Serializer para registrar usuarios.

    En el frontend tú pides: nombre, correo, contraseña.
    Django necesita un `username`, así que por ahora usaremos el correo como username.
    """

    name = serializers.CharField(max_length=150)
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
        )
        return user


# Serializer de lectura para devolver datos básicos del usuario autenticado.
class MeSerializer(serializers.ModelSerializer):
    """Serializer para regresar datos básicos del usuario autenticado."""

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name")
