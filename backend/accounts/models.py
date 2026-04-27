from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Modelo de proyecto Scrum."""

    name = models.CharField(max_length=200, verbose_name="Nombre del proyecto")
    description = models.TextField(blank=True, verbose_name="Descripcion")
    color = models.CharField(max_length=7, default="#007BFF", verbose_name="Color")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_projects",
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creacion")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ultima actualizacion")

    class Meta:
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Modelo de miembro de proyecto con rol."""

    ROLES = [
        ("Scrum Master", "Scrum Master"),
        ("Product Owner", "Product Owner"),
        ("Developer", "Developer"),
        ("Tester", "Tester"),
        ("Observer", "Observer"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name="Proyecto"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="project_memberships",
        verbose_name="Usuario"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLES,
        default="Developer",
        verbose_name="Rol en el proyecto"
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de union")

    class Meta:
        verbose_name = "Miembro de proyecto"
        verbose_name_plural = "Miembros de proyecto"
        # Un usuario solo puede tener un rol por proyecto
        unique_together = ["project", "user"]

    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.role})"


class ProjectInvitation(models.Model):
    """Invitación de un proyecto para un usuario."""

    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("accepted", "Aceptada"),
        ("rejected", "Rechazada"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="invitations",
        verbose_name="Proyecto",
    )
    invited_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="project_invitations",
        verbose_name="Usuario invitado",
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_project_invitations",
        verbose_name="Invitado por",
    )
    role = models.CharField(
        max_length=20,
        choices=ProjectMember.ROLES,
        default="Developer",
        verbose_name="Rol ofrecido",
    )
    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Estado",
    )
    is_read = models.BooleanField(default=False, verbose_name="Leida")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de invitacion")
    responded_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de respuesta")

    class Meta:
        verbose_name = "Invitacion de proyecto"
        verbose_name_plural = "Invitaciones de proyecto"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invitacion {self.project.name} -> {self.invited_user.username} ({self.status})"