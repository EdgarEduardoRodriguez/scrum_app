"""
Servicio de IA para automatización de sprints.

PRIMERO intenta con Google Gemini API (gratis, potente).
Si la API falla (cuota excedida, sin conexión), usa un algoritmo de respaldo local
que asigna tareas inteligentemente según roles y prioridades.

AHORA genera MÚLTIPLES SPRINTS dividiendo el backlog en sprints de 8-12 tareas,
agrupando tareas relacionadas y asignando un objetivo y descripción a cada uno.
"""
import json
import logging
import os
import re
import time
from datetime import date, timedelta

logger = logging.getLogger(__name__)

# ── Intentar importar Gemini ───────────────────────────────────────────────
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai no instalado. Usando solo algoritmo de respaldo local.")

# ── System prompt para el Scrum Master AI ──────────────────────────────────
SYSTEM_PROMPT_MULTI = """Eres un Scrum Master experto con años de experiencia en gestión ágil de proyectos.
Tu especialidad es planificar MÚLTIPLES SPRINTS de forma óptima, dividiendo el product backlog
en sprints sucesivos, cada uno con su propio objetivo coherente y descripción detallada.

REGLAS PARA GENERAR SPRINTS:
1. Analiza el equipo: sus roles y disponibilidad
2. Analiza el product backlog completo: prioridad, horas estimadas
3. Cada sprint debe contener entre 6 y 12 tareas como máximo
4. Agrupa tareas RELACIONADAS (ej: todas las de login juntas, todas las de UI juntas)
5. Cada sprint debe tener un TEMÁTICA CLARA (un hilo conductor)
6. Cada sprint debe tener:
   - Nombre descriptivo (ej: "Sprint 1 - Infraestructura y Diseño")
   - Objetivo claro
   - Descripción detallada de 2-3 oraciones sobre qué se trabajará
7. Ordena los sprints por dependencias lógicas (primero infraestructura, luego features)
8. Asigna cada tarea al miembro más adecuado según su rol

Devuelve SIEMPRE un JSON válido con esta estructura EXACTA:
{
    "sprints": [
        {
            "sprint_name": "Sprint 5 - Nombre Temático",
            "goal": "Objetivo claro del sprint",
            "description": "Descripción detallada de 2-3 oraciones del trabajo del sprint.",
            "duration_weeks": 2,
            "assigned_tasks": [
                {"task_id": 123, "assigned_to_user_id": 456, "order": 1}
            ]
        }
    ],
    "remaining_backlog_ids": [789, 790],
    "reasoning": "Explicación general de la planificación"
}"""

PRIORITY_ORDER = {"Alta": 0, "Media": 1, "Baja": 2}
SPRINT_DURATION_WEEKS = 2

# ============================================================================
#  FALLBACK LOCAL: Algoritmo inteligente sin API
# ============================================================================

# Temáticas predefinidas para agrupar tareas según su título
TASK_THEMES = [
    {
        "name": "Infraestructura y Diseño",
        "keywords": ["entorno", "scaffolding", "repositorio", "servidor", "base de datos", 
                     "wireframe", "mockup", "diseño", "sistema de diseño", "CI/CD", "pipeline",
                     "entorno de desarrollo", "git"],
        "description": "Configuración del entorno de desarrollo, diseño de la interfaz de usuario y establecimiento de la arquitectura base del proyecto."
    },
    {
        "name": "Autenticación y Usuarios",
        "keywords": ["registro", "inicio de sesión", "login", "JWT", "contraseña", "perfil",
                     "roles", "permisos", "admin", "google", "autenticación", "seguridad",
                     "usuario", "recuperación"],
        "description": "Implementación del sistema de autenticación, gestión de usuarios, roles y permisos, y panel de administración."
    },
    {
        "name": "Páginas Principales y Landing",
        "keywords": ["landing", "hero", "acerca", "servicios", "contacto", "formulario",
                     "mapa", "FAQ", "footer", "redes", "página"],
        "description": "Desarrollo de las páginas estáticas del sitio: landing page, acerca de, servicios, contacto y secciones informativas."
    },
    {
        "name": "Blog y Sistema de Contenido",
        "keywords": ["blog", "artículo", "categoría", "etiqueta", "post", "editor",
                     "comentario", "paginación", "búsqueda", "SEO", "sitemap", "meta",
                     "rendimiento", "contenido"],
        "description": "Creación del módulo de blog con CRUD de artículos, editor de contenido rico, sistema de comentarios y optimización SEO."
    },
    {
        "name": "Tienda Online y Pagos",
        "keywords": ["producto", "categoría", "carrito", "catálogo", "pago", "stripe",
                     "paypal", "inventario", "pedido", "notificación", "email", "compra",
                     "tienda"],
        "description": "Desarrollo del módulo de tienda online con catálogo de productos, carrito de compras, pasarela de pago y gestión de pedidos."
    },
    {
        "name": "Módulos Avanzados",
        "keywords": ["reserva", "calendario", "facturación", "reporte", "dashboard",
                     "estadística", "exportación", "PDF", "Excel", "CSV", "caching",
                     "optimización", "despliegue", "producción", "integración"],
        "description": "Implementación de funcionalidades avanzadas: sistema de reservas, facturación electrónica, panel de reportes y despliegue a producción."
    },
    {
        "name": "Pruebas y Calidad",
        "keywords": ["prueba", "test", "QA", "calidad", "rendimiento", "carga", "estrés",
                     "integración"],
        "description": "Ejecución de pruebas de calidad, seguridad, rendimiento y aseguramiento de la calidad del producto."
    },
    {
        "name": "Funcionalidades Generales",
        "keywords": [],
        "description": "Implementación de funcionalidades complementarias y mejoras generales del sistema."
    },
]


def get_theme_for_task(task_title):
    """Determina la temática de una tarea según su título."""
    title_lower = task_title.lower()
    for theme in TASK_THEMES:
        for keyword in theme["keywords"]:
            if keyword.lower() in title_lower:
                return theme
    return TASK_THEMES[-1]  # "Funcionalidades Generales"


def fallback_generate_multi_sprint(project, members, backlog_tasks, sprint_count):
    """
    Algoritmo de respaldo que genera MÚLTIPLES SPRINTS agrupando tareas por temática.
    Cada sprint tiene entre 6 y 12 tareas de una misma área funcional.
    """
    # ── Calcular miembros técnicos disponibles ────────────────────
    tech_members = [m for m in members if m.role in ("Developer", "Tester")]
    if not tech_members:
        tech_members = [m for m in members if m.role != "Observer"]
    if not tech_members:
        tech_members = list(members)

    # ── Agrupar tareas por temática ───────────────────────────────
    task_list = list(backlog_tasks)
    themed_groups = {}  # theme_name -> list of tasks

    for task in task_list:
        theme = get_theme_for_task(task.title)
        if theme["name"] not in themed_groups:
            themed_groups[theme["name"]] = {
                "tasks": [],
                "theme": theme
            }
        themed_groups[theme["name"]]["tasks"].append(task)

    # Ordenar cada grupo por prioridad
    for group in themed_groups.values():
        group["tasks"].sort(
            key=lambda t: (PRIORITY_ORDER.get(t.priority, 99), t.estimated_hours or 4)
        )

    # ── Ordenar los grupos (Infraestructura primero) ──────────────
    theme_order = {t["name"]: i for i, t in enumerate(TASK_THEMES)}
    sorted_groups = sorted(
        themed_groups.values(),
        key=lambda g: theme_order.get(g["theme"]["name"], 999)
    )

    # ── Dividir en sprints (máx 10 tareas por sprint) ────────────
    MAX_TASKS_PER_SPRINT = 10
    sprints = []
    member_index = 0
    total_sprint_index = 1

    for group in sorted_groups:
        tasks_in_group = group["tasks"]
        theme = group["theme"]

        # Dividir el grupo en chunks de max 10 tareas
        for chunk_start in range(0, len(tasks_in_group), MAX_TASKS_PER_SPRINT):
            chunk = tasks_in_group[chunk_start:chunk_start + MAX_TASKS_PER_SPRINT]

            # Asignar tareas con round-robin a miembros técnicos
            assigned_tasks = []
            for order, task in enumerate(chunk, 1):
                assigned_user_id = None
                if tech_members:
                    member = tech_members[member_index % len(tech_members)]
                    assigned_user_id = member.user.id
                    member_index += 1

                assigned_tasks.append({
                    "task_id": task.id,
                    "assigned_to_user_id": assigned_user_id,
                    "order": order,
                })

            # Generar objetivo basado en las tareas específicas
            task_titles = [t.title[:60] for t in chunk[:5]]
            high_pri_count = sum(1 for t in chunk if t.priority == "Alta")

            if high_pri_count > 0:
                goal = f"Completar {high_pri_count} tareas prioritarias de {theme['name'].lower()}"
            else:
                goal = f"Avanzar en {theme['name'].lower()}"

            # Añadir nombres de tareas al objetivo
            if task_titles:
                goal += f": {', '.join(task_titles)}"
            goal += "."

            sprint_name = f"Sprint {sprint_count + total_sprint_index} - {theme['name']}"

            # Crear descripción detallada
            description = theme["description"]
            if chunk_start > 0:
                description += f" (continuación, parte {chunk_start // MAX_TASKS_PER_SPRINT + 2})"

            sprints.append({
                "sprint_name": sprint_name,
                "goal": goal,
                "description": description,
                "duration_weeks": SPRINT_DURATION_WEEKS,
                "assigned_tasks": assigned_tasks,
            })

            total_sprint_index += 1

    all_assigned_ids = set()
    for sprint in sprints:
        for task in sprint["assigned_tasks"]:
            all_assigned_ids.add(task["task_id"])

    remaining_ids = [t.id for t in task_list if t.id not in all_assigned_ids]

    total_tasks = sum(len(s["assigned_tasks"]) for s in sprints)
    reasoning = (
        f"Se planificaron {len(sprints)} sprints temáticos con {total_tasks} tareas "
        f"agrupadas por área funcional. "
        f"Equipo: {len(tech_members)} miembros técnicos. "
        f"Quedaron {len(remaining_ids)} tareas sin asignar."
    )

    return {
        "sprints": sprints,
        "remaining_backlog_ids": remaining_ids,
        "reasoning": reasoning,
        "_source": "fallback_local",
    }


# ============================================================================
#  GEMINI API (con retry automático)
# ============================================================================

def get_gemini_client():
    """Obtiene el cliente de Gemini configurado con la API key."""
    if not GEMINI_AVAILABLE:
        logger.warning("google-genai no está instalado")
        return None

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        logger.warning("GEMINI_API_KEY no configurada o es placeholder")
        return None

    return genai.Client(api_key=api_key)


def build_project_context(project, members, backlog_tasks, sprint_count):
    """Construye el contexto del proyecto para enviar a la IA."""
    team_info = []
    for member in members:
        team_info.append({
            "user_id": member.user.id,
            "name": f"{member.user.first_name} {member.user.last_name}".strip() or member.user.username,
            "role": member.role,
        })

    backlog_info = []
    for task in backlog_tasks:
        backlog_info.append({
            "task_id": task.id,
            "title": task.title,
            "priority": task.priority,
            "estimated_hours": task.estimated_hours,
            "current_assignee": task.assignee,
            "description": task.description[:200] if task.description else "",
        })

    previous_sprints_info = ""
    if sprint_count > 0:
        previous_sprints_info = (
            f"El equipo ha completado {sprint_count} sprints anteriormente. "
            "La velocidad histórica del equipo está disponible."
        )

    return {
        "project_name": project.name,
        "team_members": team_info,
        "backlog": backlog_info,
        "previous_sprints": previous_sprints_info,
        "today": date.today().isoformat(),
    }


def call_gemini_with_retry(client, prompt, max_retries=3, base_delay=5):
    """
    Llama a Gemini API con reintentos automáticos.
    Si la cuota está excedida (429), espera y reintenta.
    """
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT_MULTI,
                    temperature=0.3,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=8192,
                ),
            )

            if response and response.text:
                return response

        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                retry_match = re.search(r'retry in (\d+\.?\d*)s', error_str)
                if retry_match:
                    delay = float(retry_match.group(1)) + 1
                else:
                    delay = base_delay * (attempt + 1)

                if attempt < max_retries - 1:
                    logger.warning(
                        f"Cuota Gemini excedida (intento {attempt + 1}/{max_retries}). "
                        f"Esperando {delay:.0f}s antes de reintentar..."
                    )
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"Gemini API sin cuota después de {max_retries} intentos")
                    return None
            else:
                logger.error(f"Error en Gemini API: {error_str}")
                return None
    return None


def generate_multi_sprint(project, members, backlog_tasks, sprint_count):
    """
    Genera MÚLTIPLES SPRINTS para cubrir todo el backlog.
    Agrupa tareas relacionadas y las divide en sprints temáticos.

    Estrategia:
    1. Intenta con Gemini API (con reintentos)
    2. Si Gemini falla, usa algoritmo de respaldo local con agrupación por temas
    """
    # ── Paso 1: Intentar con Gemini ───────────────────────────────
    client = get_gemini_client()
    if client:
        context = build_project_context(project, members, backlog_tasks, sprint_count)

        prompt = f"""
PROYECTO: {context['project_name']}

FECHA ACTUAL: {context['today']}

EQUIPO:
{json.dumps(context['team_members'], indent=2, ensure_ascii=False)}

PRODUCT BACKLOG COMPLETO (todas las tareas pendientes):
{json.dumps(context['backlog'], indent=2, ensure_ascii=False)}

CONTEXTO ADICIONAL:
{context['previous_sprints']}

INSTRUCCIONES:
Genera MÚLTIPLES SPRINTS para cubrir TODO el product backlog.

Reglas importantes:
1. Agrupa tareas RELACIONADAS en el mismo sprint (misma temática)
2. Cada sprint debe tener ENTRE 6 Y 12 TAREAS como máximo
3. NO pongas más de 12 tareas en un solo sprint
4. Si hay más de 12 tareas de una temática, créalas en sprints separados
5. Cada sprint debe tener:
   - Nombre: "Sprint N - Nombre Temático"
   - Goal: objetivo claro mencionando las tareas principales
   - Description: descripción detallada de 2-3 oraciones
6. Ordena primero infraestructura, luego features principales, luego features avanzadas

Devuelve SOLO el JSON con la estructura especificada, sin markdown ni texto adicional.
"""

        logger.info(f"Intentando generar múltiples sprints con Gemini para proyecto {project.id}")
        response = call_gemini_with_retry(client, prompt)

        if response and response.text:
            try:
                text = response.text.strip()
                if text.startswith("```"):
                    lines = text.split("\n")
                    start_idx = 0
                    end_idx = len(lines)
                    for i, line in enumerate(lines):
                        if line.strip().startswith("```"):
                            if start_idx == 0:
                                start_idx = i + 1
                            else:
                                end_idx = i
                                break
                    text = "\n".join(lines[start_idx:end_idx]).strip()

                result = json.loads(text)
                result["_source"] = "gemini"
                logger.info(f"Gemini generó {len(result.get('sprints', []))} sprints")
                return result
            except (json.JSONDecodeError, Exception) as e:
                logger.warning(f"Error procesando respuesta de Gemini: {e}. Usando fallback local.")
        else:
            logger.warning("Gemini no respondió. Usando fallback local.")
    else:
        logger.info("Gemini no disponible. Usando algoritmo de respaldo local.")

    # ── Paso 2: Fallback local ───────────────────────────────────
    logger.info(f"Generando múltiples sprints con algoritmo local para proyecto {project.id}")
    fallback_result = fallback_generate_multi_sprint(project, members, backlog_tasks, sprint_count)
    fallback_result["_source"] = "fallback_local"
    logger.info(f"Fallback local generó {len(fallback_result.get('sprints', []))} sprints")
    return fallback_result


def calculate_sprint_dates_sequence(base_date=None, sprint_index=0, duration_weeks=2):
    """
    Calcula fechas para sprints secuenciales.

    Sprint 0: empieza en base_date
    Sprint 1: empieza donde terminó el anterior
    etc.
    """
    if base_date is None:
        base_date = date.today() + timedelta(days=1)
    else:
        if isinstance(base_date, str):
            base_date = date.fromisoformat(base_date)

    start = base_date + timedelta(weeks=duration_weeks * sprint_index)
    end = start + timedelta(weeks=duration_weeks)

    return start.isoformat(), end.isoformat()