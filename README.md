# EisenhowerFlow

Aplicación web de gestión de tareas y productividad basada en la matriz de Eisenhower, desarrollada con Django y Bootstrap. Permite organizar el trabajo diario mediante tableros colaborativos, clasificar tareas por urgencia e importancia y automatizar recordatorios por correo electrónico.

**Demo en producción:** [https://eisenhowerflow.onrender.com](https://eisenhowerflow.onrender.com)

---

## Características principales

- **Matriz de Eisenhower interactiva:** Clasificación visual en cuatro cuadrantes (*Hacer*, *Planificar*, *Delegar* y *Eliminar*) con actualización dinámica mediante peticiones asíncronas.
- **Tableros colaborativos:** Creación de múltiples espacios de trabajo con sistema de invitaciones, gestión de permisos y panel de notificaciones en tiempo real.
- **Sistema de recordatorios y correo transaccional:** Envío automatizado de avisos de vencimiento y recuperación de contraseñas a través de un backend personalizado integrado con la API HTTP v3 de SendGrid (`core/email_backend.py`).
- **Internacionalización (i18n):** Soporte completo para español e inglés tanto en la interfaz web como en las plantillas de correo electrónico.
- **Autenticación y perfiles de usuario:** Registro, inicio de sesión, recuperación de contraseña y configuración de cuenta.

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
task_manager/
├── core/                   # Configuración principal, settings, backend de email y plantillas base
│   ├── email_backend.py    # Integración con SendGrid API v3
│   ├── settings.py         # Configuración de entornos, seguridad e i18n
│   └── templates/          # Plantillas globales, registro y correos HTML
├── tasks/                  # Lógica de tableros, cuadrantes, tareas, invitaciones y notificaciones
├── users/                  # Gestión de usuarios, autenticación y perfiles
├── static/                 # Recursos estáticos (CSS compilado, JS, SVG/PNG)
├── manage.py
└── requirements.txt