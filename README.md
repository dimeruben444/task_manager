# EisenhowerFlow

Aplicación web de gestión de tareas y productividad basada en la matriz de Eisenhower, desarrollada con Django y Bootstrap. Permite organizar el trabajo diario mediante tableros colaborativos, clasificar tareas por urgencia e importancia y automatizar recordatorios por correo electrónico.

**Demo en producción:** [https://eisenhowerflow.onrender.com](https://eisenhowerflow.onrender.com)

---

## Características principales

- **Matriz de Eisenhower interactiva:** Clasificación visual en cuatro cuadrantes (*Hacer*, *Planificar*, *Delegar* y *Eliminar*) con actualización dinámica mediante peticiones asíncronas y soporte *drag-and-drop*.
- **Tableros colaborativos:** Creación de múltiples espacios de trabajo (`boards`) con sistema de invitaciones, gestión de miembros y panel de notificaciones en tiempo real.
- **Sistema de recordatorios y correo transaccional:** Envío automatizado de avisos de vencimiento y recuperación de contraseñas a través de un backend personalizado integrado con la API HTTP v3 de SendGrid (`core/email_backend.py`).
- **Internacionalización (i18n):** Soporte completo para español e inglés (`locale/`) tanto en la interfaz web como en las plantillas de correo electrónico.
- **Autenticación y perfiles de usuario:** Registro, inicio de sesión personalizado, recuperación de contraseña y gestión de cuenta.
- **Suite de pruebas:** Cobertura de tests unitarios y de integración por aplicación, junto con pruebas End-to-End en `e2e/`.

---

## Stack tecnológico

- **Backend:** Python 3.9, Django 4.2
- **Frontend:** HTML5, SCSS/CSS, Bootstrap 5, JavaScript (Vanilla / Fetch API)
- **Base de datos:** PostgreSQL (producción) / SQLite3 (desarrollo local)
- **Correo electrónico:** SendGrid Web API v3
- **Despliegue:** Render, Gunicorn, WhiteNoise

---

## Estructura del proyecto

```text
taskmanager/
├── boards/                 # Gestión de tableros colaborativos, invitaciones y notificaciones
├── core/                   # Configuración global, backend de email y plantillas base
│   ├── email_backend.py    # Integración con SendGrid Web API v3
│   ├── settings.py         # Configuración de entornos, seguridad e i18n
│   └── templates/          # Plantillas globales, registro y correos HTML
├── tasks/                  # Lógica de tareas, cuadrantes, formularios y comandos de recordatorio
│   └── management/commands/# Comando send_reminders para envío programado
├── users/                  # Autenticación personalizada, modelos de usuario y señales
├── e2e/                    # Pruebas End-to-End (autenticación, dashboard y modales)
├── locale/                 # Archivos de traducción (en / es)
├── static/                 # Recursos estáticos (SCSS, CSS compilado, JS e imágenes)
├── manage.py
├── Procfile
├── requirements.txt
├── run_auto_reminders.py
└── runtime.txt
```


---

## Autoría y derechos

Desarrollado por **Rubén López Pérez**. Todos los derechos reservados.