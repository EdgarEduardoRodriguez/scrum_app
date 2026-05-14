from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Project, ProjectInvitation, ProjectMember, Task, TimeEntry


# Serializer para miembros de proyecto
class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ProjectMember."""

    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "user_id", "username", "first_name", "last_name", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


# Serializer para proyectos (con miembros)
class ProjectSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Project."""

    members = ProjectMemberSerializer(many=True, read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "members",
            "my_role",
            "sprint_count",
            "tasks_total",
            "tasks_completed",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "sprint_count", "tasks_total", "tasks_completed"]

    sprint_count = serializers.SerializerMethodField()
    tasks_total = serializers.SerializerMethodField()
    tasks_completed = serializers.SerializerMethodField()

    def get_sprint_count(self, obj):
        return getattr(obj, "_sprint_count", 0)

    def get_tasks_total(self, obj):
        return getattr(obj, "_tasks_total", 0)

    def get_tasks_completed(self, obj):
        return getattr(obj, "_tasks_completed", 0)

    def get_my_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            membership = obj.members.filter(user=request.user).first()
            if membership:
                return membership.role
        return None

    def create(self, validated_data):
        project = Project.objects.create(**validated_data)
        ProjectMember.objects.create(
            project=project,
            user=self.context["request"].user,
            role="Scrum Master"
        )
        return project


# Serializer para crear/actualizar miembros
class AddMemberSerializer(serializers.Serializer):
    """Serializer para agregar un miembro al proyecto."""

    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=ProjectMember.ROLES, default="Developer")


class ProjectInvitationSerializer(serializers.ModelSerializer):
    """Serializer para invitaciones de proyecto."""

    invitation_id = serializers.CharField(source="id", read_only=True)
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    invited_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectInvitation
        fields = [
            "id",
            "invitation_id",
            "project_id",
            "project_name",
            "invited_by_name",
            "role",
            "status",
            "is_read",
            "created_at",
            "responded_at",
        ]

    def get_invited_by_name(self, obj):
        name = f"{obj.invited_by.first_name} {obj.invited_by.last_name}".strip()
        return name or obj.invited_by.username


class TimeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeEntry
        fields = ["id", "task", "hours", "logged_by", "note", "date"]
        read_only_fields = ["id", "task", "date"]


class TaskSerializer(serializers.ModelSerializer):
    time_entries = TimeEntrySerializer(many=True, read_only=True)
    assignee_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "project", "title", "description", "status",
            "priority", "assignee", "assignee_name", "avatar_color", "estimated_hours",
            "time_entries", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "project", "assignee_name", "time_entries", "created_at", "updated_at"]

    def get_assignee_name(self, obj):
        if obj.assignee is None:
            return "Sin asignar"
        try:
            member = ProjectMember.objects.get(project=obj.project, user_id=obj.assignee)
            name = f"{member.user.first_name} {member.user.last_name}".strip()
            return name or member.user.username
        except ProjectMember.DoesNotExist:
            return "Sin asignar"


# Serializer para validar y crear usuarios desde el endpoint de registro.
class RegisterSerializer(serializers.Serializer):
    """Serializer para registrar usuarios."""

    name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=4)

    def validate_email(self, value):
        if User.objects.filter(username=value).exists() or User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese correo")
        return value

    def create(self, validated_data):
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