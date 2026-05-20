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


class Task(models.Model):
    STATUS_CHOICES = [
        ("To Do", "To Do"),
        ("In Progress", "In Progress"),
        ("Done", "Done"),
    ]
    PRIORITY_CHOICES = [
        ("Alta", "Alta"),
        ("Media", "Media"),
        ("Baja", "Baja"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="Proyecto"
    )
    title = models.CharField(max_length=300, verbose_name="Título")
    description = models.TextField(blank=True, verbose_name="Descripción")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="To Do", verbose_name="Estado"
    )
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="Media", verbose_name="Prioridad"
    )
    assignee = models.IntegerField(blank=True, null=True, default=None, verbose_name="Responsable (ID)")
    avatar_color = models.CharField(max_length=7, default="#3B82F6", verbose_name="Color avatar")
    estimated_hours = models.FloatField(default=4, verbose_name="Horas estimadas")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Tarea"
        verbose_name_plural = "Tareas"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class TimeEntry(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="time_entries",
        verbose_name="Tarea"
    )
    hours = models.FloatField(verbose_name="Horas")
    logged_by = models.CharField(max_length=150, default="Usuario", verbose_name="Registrado por")
    note = models.TextField(blank=True, null=True, verbose_name="Nota")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Fecha")

    class Meta:
        verbose_name = "Registro de tiempo"
        verbose_name_plural = "Registros de tiempo"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.hours}h - {self.task.title}"


class Sprint(models.Model):
    STATUS_CHOICES = [
        ("Planificando", "Planificando"),
        ("En Progreso", "En Progreso"),
        ("Completado", "Completado"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="sprints",
        verbose_name="Proyecto"
    )
    name = models.CharField(max_length=200, verbose_name="Nombre del sprint")
    goal = models.TextField(blank=True, verbose_name="Objetivo del sprint")
    start_date = models.DateField(null=True, blank=True, verbose_name="Fecha de inicio")
    end_date = models.DateField(null=True, blank=True, verbose_name="Fecha de fin")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Planificando", verbose_name="Estado"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Sprint"
        verbose_name_plural = "Sprints"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.project.name}"


class SprintTask(models.Model):
    """Relación muchas-a-muchas entre Sprint y Task con orden."""
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.CASCADE,
        related_name="sprint_tasks",
        verbose_name="Sprint"
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="sprint_assignments",
        verbose_name="Tarea"
    )
    order = models.IntegerField(default=0, verbose_name="Orden")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de adición")

    class Meta:
        verbose_name = "Tarea de sprint"
        verbose_name_plural = "Tareas de sprint"
        unique_together = ["sprint", "task"]
        ordering = ["order", "added_at"]

    def __str__(self):
        return f"{self.sprint.name} -> {self.task.title}"
