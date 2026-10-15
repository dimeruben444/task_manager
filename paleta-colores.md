# Guía de Paleta de Colores y Tokens UI — Eisenhower Flow (Clarity Workspace)

Esta guía define todos los colores hexadecimales, variables CSS y clases de Tailwind CSS utilizados en la vista principal (**Tablero General / Trello & Jira**) para que puedas implementarlos de forma consistente en tu frontend (React, Vue, Tailwind CSS o CSS puro).

---

## 1. Fondos y Superficies Principales (Backgrounds & Surfaces)

| Elemento / Zona | Hex / Valor | Tailwind CSS | Descripción / Uso |
| :--- | :--- | :--- | :--- |
| **Lienzo Global (Body Background)** | `#fbf8ff` / `#f8fafc` | `bg-slate-50` / `bg-zinc-50` | Fondo base de toda la aplicación |
| **Navbar Superior (Barra Superior)** | `#1e293b` (o `#0f172a`) | `bg-slate-800` | Barra superior oscura de contraste |
| **Sidebar Izquierdo (Lateral)** | `#ffffff` | `bg-white` | Barra de navegación lateral fija |
| **Contenedor Matriz / Área de Trabajo** | `#f8fafc` | `bg-slate-50` | Área central de cuadrantes |
| **Contenedores de Cuadrantes (Q1 - Q4)** | `#f1f5f9` (o `#f8fafc`) | `bg-slate-100/70` | Superficie de fondo de cada cuadrante 2×2 |
| **Tarjetas de Tareas (Task Cards)** | `#ffffff` | `bg-white` | Tarjetas interactivas flotantes |
| **Barra Creación Rápida (Quick-Add)** | `#ffffff` | `bg-white` | Módulo superior de entrada de tarea |
| **Panel Lateral Derecho (Completadas)**| `#ffffff` | `bg-white` | Columna de tareas completadas |
| **Items de Tareas Completadas** | `#f8fafc` | `bg-slate-50` | Fondo individual de item finalizado |

---

## 2. Barra Superior (Navbar Superior)

| Componente | Hex / Valor | Tailwind CSS | Uso |
| :--- | :--- | :--- | :--- |
| **Fondo Navbar** | `#1e293b` | `bg-slate-800` | Fondo de la barra horizontal superior |
| **Borde Inferior** | `#334155` | `border-slate-700` | Separador inferior fino (`1px`) |
| **Texto Título Logo ("Eisenhower")** | `#ffffff` | `text-white` | Nombre principal de la marca |
| **Texto Logo Acento ("Flow")** | `#60a5fa` | `text-blue-400` | Palabra destacada del isotipo |
| **Badge "Workspace"** | Fondo: `rgba(255,255,255,0.08)`, Texto: `#cbd5e1` | `bg-white/10 text-slate-300` | Chip junto al nombre del espacio |
| **Input Barra de Búsqueda (Fondo)** | `#0f172a` (o `rgba(15, 23, 42, 0.6)`) | `bg-slate-900/60` | Fondo del input de búsqueda central |
| **Input Búsqueda (Borde)** | `#334155` | `border-slate-700` | Borde del buscador |
| **Input Búsqueda (Texto / Placeholder)**| Texto: `#f8fafc`, Placeholder: `#94a3b8` | `text-slate-100 placeholder-slate-400` | Tipografía del buscador |
| **Atajo teclado (`⌘K`)** | Fondo: `#1e293b`, Borde: `#334155`, Texto: `#94a3b8` | `bg-slate-800 border-slate-700 text-slate-400` | Badge de atajo |
| **Avatar de Usuario (`rbn`)** | Fondo: `#2563eb`, Texto: `#ffffff` | `bg-blue-600 text-white` | Círculo de perfil de usuario |

---

## 3. Sidebar Izquierdo (Navegación Lateral)

| Componente | Hex / Valor | Tailwind CSS | Uso |
| :--- | :--- | :--- | :--- |
| **Borde Lateral Derecho** | `#e2e8f0` | `border-slate-200` | Separador entre sidebar y contenido |
| **Títulos de Sección ("TABLEROS")** | `#64748b` | `text-slate-500` | Texto `text-[11px] font-semibold uppercase` |
| **Item Activo (Fondo)** | `#eff6ff` | `bg-blue-50` | Pestaña seleccionada (ej. `General`) |
| **Item Activo (Texto)** | `#1d4ed8` | `text-blue-700` | Texto del tablero seleccionado |
| **Item Inactivo (Texto)** | `#475569` (Hover: `#0f172a`) | `text-slate-600 hover:text-slate-900` | Pestañas secundarias |
| **Badge Contador Activo** | Fondo: `#dbeafe`, Texto: `#1d4ed8` | `bg-blue-100 text-blue-700` | Contador numérico (ej. `4`) |
| **Botón "+ Nuevo Tablero"** | Borde: `#cbd5e1`, Texto: `#64748b` | `border-dashed border-slate-300 text-slate-600` | Botón dashed inferior |
| **Card Resumen ("7 completadas hoy")** | Fondo: `#ecfdf5`, Borde: `#a7f3d0`, Texto: `#065f46` | `bg-emerald-50 border-emerald-200 text-emerald-800` | Widget métricas de productividad |

---

## 4. Cuadrantes Eisenhower (Colores Semánticos de Matriz)

Cada cuadrante cuenta con un acento propio para identificar el nivel de prioridad:

### 🔴 Q1: Urgente e Importante (Hacer ahora)
* **Badge / Tag Cabecera:** Fondo `#fee2e2`, Texto e Icono `#dc2626` (`bg-red-100 text-red-600`)
* **Contador de tareas:** Fondo `#ef4444`, Texto `#ffffff` (`bg-red-500 text-white`)
* **Borde sutil contenedor:** `#fecaca` (`border-red-200`)
* **Píldora de estado ("Mañana"):** Fondo `#fef3c7`, Texto `#b45309` (`bg-amber-100 text-amber-700`)

### 🔵 Q2: Importante y No Urgente (Planificar)
* **Badge / Tag Cabecera:** Fondo `#dbeafe`, Texto e Icono `#2563eb` (`bg-blue-100 text-blue-600`)
* **Contador de tareas:** Fondo `#3b82f6`, Texto `#ffffff` (`bg-blue-500 text-white`)
* **Borde sutil contenedor:** `#bfdbfe` (`border-blue-200`)
* **Chip de fecha ("24 Oct"):** Fondo `#eff6ff`, Borde `#dbeafe`, Texto `#1d4ed8` (`bg-blue-50 border-blue-100 text-blue-700`)
* **Tag categoría ("Backend"):** Fondo `#f1f5f9`, Texto `#475569` (`bg-slate-100 text-slate-600`)

### 🟡 Q3: Urgente y No Importante (Delegar)
* **Badge / Tag Cabecera:** Fondo `#fef3c7`, Texto e Icono `#d97706` (`bg-amber-100 text-amber-600`)
* **Contador de tareas:** Fondo `#f59e0b`, Texto `#ffffff` (`bg-amber-500 text-white`)
* **Borde sutil contenedor:** `#fde68a` (`border-amber-200`)
* **Tag asignado ("Delegado a QA"):** Fondo `#faf5ff`, Texto `#7e22ce` (`bg-purple-50 text-purple-700`)

### ⚪ Q4: No Urgente y No Importante (Eliminar / Descartar)
* **Badge / Tag Cabecera:** Fondo `#f1f5f9`, Texto e Icono `#64748b` (`bg-slate-100 text-slate-500`)
* **Contador de tareas:** Fondo `#94a3b8`, Texto `#ffffff` (`bg-slate-400 text-white`)
* **Estado vacío (Empty State):** Borde punteado `#e2e8f0`, Texto `#94a3b8`, Icono `#10b981` en fondo `#ecfdf5`

---

## 5. Módulo Superior de Creación Rápida (Quick-Add Bar)

| Elemento | Hex / Valor | Tailwind CSS |
| :--- | :--- | :--- |
| **Input de Texto (`¿Qué hay que hacer?`)** | Borde: `#cbd5e1`, Fondo: `#ffffff`, Texto: `#0f172a` | `bg-white border-slate-300 text-slate-900` |
| **Input Focus** | Borde / Anillo: `#2563eb` | `focus:border-blue-600 focus:ring-blue-100` |
| **Estrellas Activas (Calificación)** | `#eab308` (Amarillo oro) | `text-yellow-500 fill-yellow-500` |
| **Estrellas Inactivas** | `#cbd5e1` (Gris claro) | `text-slate-300` |
| **Steppers `[-]` y `[+]`** | Fondo: `#f8fafc`, Borde: `#e2e8f0`, Hover: `#f1f5f9` | `bg-slate-50 border-slate-200 hover:bg-slate-100` |
| **Badge Nivel Urgencia ("Alta 3/4")** | Fondo: `#fee2e2`, Texto: `#dc2626` | `bg-red-100 text-red-600` |
| **Badge Nivel Importancia ("Crítica 4/4")** | Fondo: `#ede9fe`, Texto: `#7c3aed` | `bg-violet-100 text-violet-700` |
| **Botón de Añadir Tarea (`+`)** | Fondo: `#2563eb`, Hover: `#1d4ed8`, Icono: `#ffffff` | `bg-blue-600 hover:bg-blue-700 text-white` |
| **Badge Destino Automático (`Q1`)** | Fondo: `#fee2e2`, Texto: `#b91c1c` | `bg-red-100 text-red-700` |

---

## 6. Panel Lateral de Tareas Completadas

| Elemento | Hex / Valor | Tailwind CSS |
| :--- | :--- | :--- |
| **Borde del Panel** | `#e2e8f0` | `border-slate-200` |
| **Checkmark Circular Completado** | `#10b981` (Esmeralda) | `text-emerald-500 fill-emerald-500` |
| **Texto de Tarea Tachada** | `#64748b` con `line-through` | `text-slate-500 line-through` |
| **Botón de Limpiar / Papelera** | Texto: `#94a3b8`, Hover: `#ef4444` | `text-slate-400 hover:text-red-500` |
| **Enlace "Ver historial completo"** | `#2563eb` (Hover: `#1d4ed8`) | `text-blue-600 hover:text-blue-700` |

---

## 7. Variables CSS / Tokens Directos (CSS Custom Properties)

```css
:root {
  /* Fondos y Layout */
  --bg-app: #fbf8ff;
  --bg-surface: #ffffff;
  --bg-surface-subtle: #f8fafc;
  --bg-navbar: #1e293b;
  --bg-navbar-search: #0f172a;
  
  /* Bordes */
  --border-light: #f1f5f9;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;
  --border-navbar: #334155;

  /* Textos */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-on-dark: #ffffff;

  /* Acción Principal / Acentos */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #eff6ff;

  /* Cuadrantes Eisenhower */
  --q1-urgent-important: #ef4444;
  --q1-bg: #fee2e2;
  
  --q2-important-not-urgent: #3b82f6;
  --q2-bg: #dbeafe;
  
  --q3-urgent-not-important: #f59e0b;
  --q3-bg: #fef3c7;
  
  --q4-not-urgent-not-important: #64748b;
  --q4-bg: #f1f5f9;

  /* Éxito / Completadas */
  --success: #10b981;
  --success-bg: #ecfdf5;
}
```
