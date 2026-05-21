"""
Script para crear datos de prueba: proyecto de página web con 50 tareas.
Ejecutar con: python seed_data.py
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth.models import User
from accounts.models import Project, ProjectMember, Task

def seed():
    # ── 1. Crear o obtener proyecto ──────────────────────────────
    project, created = Project.objects.get_or_create(
        name='Sitio Web Corporativo Premium',
        defaults={
            'description': 'Desarrollo completo de un sitio web corporativo con blog, '
                          'tienda online, panel de administración, sistema de reservas, '
                          'y módulo de facturación electrónica.',
            'color': '#6366F1',
        }
    )

    if created:
        print(f"✅ Proyecto '{project.name}' creado con ID {project.id}")
    else:
        print(f"ℹ️  Proyecto ya existente (ID {project.id})")
        # Limpiar datos anteriores
        Task.objects.filter(project=project).delete()
        ProjectMember.objects.filter(project=project).delete()
        print("   Tareas y miembros anteriores eliminados")

    # ── 2. Asignar miembros al proyecto con roles ────────────────
    members_data = [
        (4, 'Scrum Master'),    # lalo
        (2, 'Product Owner'),   # edgar
        (3, 'Developer'),       # carlos
        (5, 'Developer'),       # eduardo
        (6, 'Developer'),       # edgar rodriguez
        (7, 'Developer'),       # juan pablo
        (8, 'Tester'),          # carlos estrada
        (9, 'Tester'),          # eduardo briseño
    ]

    for user_id, role in members_data:
        pm, created = ProjectMember.objects.get_or_create(
            project=project,
            user=User.objects.get(id=user_id),
            defaults={'role': role}
        )
        if created:
            print(f"   Miembro {pm.user.first_name} ({role}) agregado")

    # ── 3. Crear 50 tareas del proyecto web ──────────────────────
    tasks = [
        # === INFRAESTRUCTURA Y DISEÑO ===
        ("Configurar entorno de desarrollo", "Alta", 4, 4),
        ("Diseñar wireframes de todas las páginas", "Alta", 8, 2),
        ("Crear mockups en Figma", "Alta", 12, 2),
        ("Diseñar sistema de diseño", "Alta", 6, 2),
        ("Configurar repositorio Git y ramas", "Media", 2, 4),
        ("Configurar servidor de desarrollo", "Alta", 3, 6),
        ("Crear scaffolding del frontend (React + Vite)", "Alta", 5, 3),
        ("Crear scaffolding del backend (Django REST)", "Alta", 5, 3),
        ("Configurar base de datos y migraciones iniciales", "Alta", 3, 6),
        ("Configurar CI/CD pipeline", "Media", 6, 7),

        # === AUTENTICACIÓN Y USUARIOS ===
        ("Implementar registro de usuarios", "Alta", 6, 3),
        ("Implementar inicio de sesión con JWT", "Alta", 5, 3),
        ("Implementar recuperación de contraseña", "Media", 4, 5),
        ("Crear panel de perfil de usuario", "Media", 6, 5),
        ("Implementar roles y permisos", "Alta", 8, 6),
        ("Crear página de administración de usuarios", "Media", 6, 7),
        ("Implementar autenticación con Google", "Media", 5, 5),
        ("Pruebas de seguridad en autenticación", "Alta", 4, 8),

        # === PÁGINAS PRINCIPALES ===
        ("Desarrollar landing page (hero, características, testimonios)", "Alta", 10, 3),
        ("Crear página Acerca de nosotros", "Media", 4, 5),
        ("Crear página de servicios", "Media", 6, 6),
        ("Crear página de contacto con formulario", "Alta", 5, 7),
        ("Implementar mapa interactivo (Google Maps API)", "Baja", 4, 5),
        ("Crear sección de preguntas frecuentes (FAQ)", "Media", 4, 6),
        ("Implementar footer con enlaces y redes sociales", "Baja", 3, 3),

        # === BLOG Y SISTEMA DE CONTENIDO ===
        ("Crear modelo de blog (categorías, etiquetas, posts)", "Alta", 6, 3),
        ("Implementar CRUD de artículos", "Alta", 8, 3),
        ("Crear editor de contenido rico (Rich Text Editor)", "Alta", 8, 5),
        ("Implementar sistema de comentarios", "Media", 6, 6),
        ("Crear página de listado de artículos con paginación", "Media", 5, 6),
        ("Crear página de detalle de artículo", "Media", 4, 7),
        ("Implementar búsqueda de artículos", "Media", 5, 5),
        ("Agregar SEO básico (meta tags, sitemap)", "Alta", 4, 3),
        ("Pruebas de rendimiento del blog", "Media", 3, 8),

        # === TIENDA ONLINE ===
        ("Crear modelos de productos y categorías", "Alta", 6, 3),
        ("Implementar carrito de compras", "Alta", 10, 5),
        ("Crear página de catálogo de productos", "Alta", 8, 6),
        ("Implementar pasarela de pago (Stripe/PayPal)", "Alta", 12, 7),
        ("Crear página de detalle de producto", "Media", 5, 5),
        ("Implementar gestión de inventario", "Media", 6, 6),
        ("Crear historial de pedidos", "Media", 5, 3),
        ("Implementar notificaciones de pedidos por email", "Baja", 5, 5),
        ("Pruebas de flujo de compra completo", "Alta", 6, 8),

        # === MÓDULOS AVANZADOS ===
        ("Desarrollar sistema de reservas en línea", "Alta", 10, 7),
        ("Crear calendario de disponibilidad", "Media", 6, 6),
        ("Implementar módulo de facturación electrónica", "Alta", 12, 3),
        ("Crear panel de reportes y estadísticas (dashboard)", "Alta", 10, 5),
        ("Implementar exportación de datos (PDF, Excel, CSV)", "Media", 6, 6),
        ("Optimización de rendimiento general", "Alta", 8, 7),
        ("Pruebas de integración y despliegue a producción", "Alta", 12, 8),
    ]

    created_count = 0
    for title, priority, hours, assignee_id in tasks:
        Task.objects.create(
            project=project,
            title=title,
            description=f'Tarea: {title} - Desarrollo del sitio web corporativo premium.',
            priority=priority,
            estimated_hours=hours,
            assignee=assignee_id,
            status='To Do',
            avatar_color='#6366F1',
        )
        created_count += 1

    print(f"\n📊 Resumen:")
    print(f"   Proyecto: {project.name} (ID {project.id})")
    print(f"   Miembros: {ProjectMember.objects.filter(project=project).count()}")
    print(f"   Tareas creadas: {created_count}")
    print(f"\n✅ Seed completado exitosamente!")
    print(f"   Ahora ve a la página de Sprints y haz clic en 'Generar con IA'")

if __name__ == "__main__":
    seed()