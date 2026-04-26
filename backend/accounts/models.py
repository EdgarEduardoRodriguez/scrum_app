from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    """Modelo de proyecto Scrum asociado a un usuario."""

    name = models.CharField(max_length=200, verbose_name="Nombre del proyecto")
    description = models.TextField(blank=True, verbose_name="Descripcion")
    color = models.CharField(max_length=7, default="#007BFF", verbose_name="Color")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="projects",
        verbose_name="Propietario"
    )
    role = models.CharField(
        max_length=50,
        default="Scrum Master",
        verbose_name="Rol en el proyecto"
    )
    created_at = models.DateField(auto_now_add=True, verbose_name="Fecha de creacion")
    updated_at = models.DateField(auto_now=True, verbose_name="Ultima actualizacion")

    class Meta:
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name