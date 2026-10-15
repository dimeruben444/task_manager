# Especificación de Medidas y Layout — Eisenhower Flow (Tablero Trello / Jira)

Esta guía recopila todas las medidas clave, sistema de espaciado, alturas, anchos de rejilla y tokens de Tailwind CSS utilizados en la interfaz para su implementación directa en frontend (React, Vue, Tailwind CSS o CSS estándar).

---

## 1. Estructura General y Retícula (Grid / Layout)

| Contenedor / Zona | Ancho (`width`) | Alto (`height`) | Padding / Margen | Comportamiento |
| :--- | :--- | :--- | :--- | :--- |
| **Viewport total** | `100vw` (min. `1280px` - `1440px`) | `100vh` | `p-0` | `overflow-hidden` o scroll controlado |
| **Navbar Superior** | `100%` (`w-full`) | `64px` (`h-16`) | `px-6 py-0` (`24px`) | Fijo arriba (`border-b`, `z-30`) |
| **Sidebar Izquierdo** | `260px` (`w-[260px]`) | `calc(100vh - 64px)` | `p-5` (`20px`) | Fijo / estático lateral |
| **Contenedor Principal** | `calc(100% - 260px)` | Auto / scroll | `p-6` (`24px`) | Área de trabajo central + panel derecho |
| **Área Central (Cuadrantes + Quick Add)** | Flexible (`flex-1` / min `820px`) | Auto | `gap-6` (`24px`) | Flexbox vertical o CSS Grid |
| **Panel Lateral Derecho (Completadas)** | `320px` - `360px` (`w-[340px]`) | Auto / scrollable | `gap-3` (`12px`) | Columna dedicada |

---

## 2. Navbar Superior (`h-16` / `64px`)

* **Alto total:** `64px` (`h-16`)
* **Padding:** horizontal `24px` (`px-6`), centrado vertical `items-center`
* **Borde inferior:** `1px solid #e4e4e7` (Tailwind: `border-b border-zinc-200`)
* **Logo & Brand:**
  * Icono de isotipo: `32px × 32px` (`w-8 h-8`), `rounded-xl` (`12px`)
  * Tipografía título: `16px` (`text-base`), `font-bold`, `leading-tight`
  * Badge workspace: `font-size: 11px`, `px-2 py-0.5`, `rounded-full`, `bg-zinc-100`
* **Barra de Búsqueda Global (Central):**
  * Ancho: `max-w-md` a `max-w-lg` (`440px` a `512px`)
  * Alto: `40px` (`h-10`)
  * Padding: `pl-10 pr-3` (`40px` inicio para icono lupa, `12px` final)
  * Border radius: `rounded-xl` (`12px`) o `rounded-full` (`9999px`)
  * Atajo de teclado (`⌘K`): badge de `20px × 20px`, `rounded-md`, `text-[11px]`
* **Controles de Usuario (Derecha):**
  * Botón de notificaciones: `36px × 36px` (`w-9 h-9`), `rounded-lg`
  * Avatar de usuario (`rbn`): `32px × 32px` (`w-8 h-8`), circular (`rounded-full`), texto `12px` (`text-xs font-semibold`)

---

## 3. Sidebar Izquierdo (`w-[260px]`)

* **Ancho:** `260px` fijo (`flex-shrink-0`)
* **Padding:** `20px` (`p-5`)
* **Borde derecho:** `1px solid #e4e4e7` (`border-r border-zinc-200`)
* **Cabecera de sección:** `font-size: 11px`, `tracking-wider`, `uppercase`, `font-semibold`, `mb-3`
* **Items de navegación (Tableros):**
  * Alto: `38px` (`h-[38px]`)
  * Padding: `px-3 py-2`
  * Border radius: `rounded-lg` (`8px`)
  * Gap entre icono y texto: `10px` (`gap-2.5`)
  * Badge contador: `20px` alto (`h-5 min-w-[20px]`), `px-1.5`, `text-xs`, `rounded-full`
* **Botón "+ Nuevo Tablero":**
  * Alto: `36px` (`h-9`)
  * Estilo: borde punteado `1px dashed #d4d4d8`, `rounded-xl`, `w-full`
  * Margen inferior: `mb-6` (`24px`)
* **Módulo inferior (Estadística de Completadas hoy):**
  * Padding: `14px 16px` (`p-3.5`)
  * Border radius: `rounded-xl` (`12px`)
  * Fondo: verde pastel suave (`bg-emerald-50/60`, borde `border-emerald-100`)

---

## 4. Barra Superior de Creación Rápida de Tarea (Quick-Add Bar)

* **Contenedor exterior:**
  * Fondo: `#ffffff` con borde `1px solid #f4f4f5` (`border-zinc-100`)
  * Padding: `16px 20px` (`p-4 sm:p-5`)
  * Border radius: `rounded-2xl` (`16px`)
  * Sombra: `shadow-sm` (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`)
  * Margen inferior: `mb-6` (`24px`)
* **Fila de Inputs:**
  * Campo de texto principal:
    * Alto: `44px` (`h-11`)
    * Padding: `px-4` (`16px`)
    * Border radius: `rounded-xl` (`12px`)
    * Fuente: `14px` (`text-sm`)
  * Controles de Urgencia e Importancia (Selector de Estrellas):
    * Altura de caja: `44px` (`h-11`)
    * Botones stepper `[-]` y `[+]`: `28px × 28px` (`w-7 h-7`), `rounded-lg`
    * Tamaño estrellas: `16px × 16px` (`w-4 h-4`), `gap-1`
    * Badge de estado (ej. "Alta (3/4)", "Crítica (4/4)"): `text-[11px] font-semibold`, `px-2 py-0.5`, `rounded-md`
  * Botón Añadir `[+]`:
    * Tamaño: `44px × 44px` (`w-11 h-11`), `flex-shrink-0`
    * Border radius: `rounded-xl` (`12px`)
    * Icono: `20px × 20px`
* **Fila de Metadatos Inferior:**
  * Alto / espaciado: `mt-3`, `text-xs` (`12px`)
  * Badge destino automático: `px-2.5 py-0.5`, `rounded-full`, `font-medium`

---

## 5. Matriz Eisenhower 2×2 (Los 4 Cuadrantes)

* **Estructura:** CSS Grid de 2 columnas × 2 filas
  * `grid grid-cols-2 gap-5` (`gap: 20px`)
  * Alto mínimo por cuadrante: `280px` - `320px`
* **Contenedor de Cuadrante:**
  * Fondo: `#fbfbfc` / `#f8fafc` con borde `1px solid #f1f1f4`
  * Padding interior: `16px` (`p-4`)
  * Border radius: `rounded-2xl` (`16px`)
  * Header del cuadrante:
    * Icono contenedor: `28px × 28px` (`w-7 h-7`), `rounded-lg`
    * Badge contador de tareas: `22px × 22px` (`w-[22px] h-[22px]`), circular (`rounded-full`), `text-xs font-bold`
    * Título cuadrante: `14px` (`font-bold text-zinc-900`)
    * Subtítulo / descripción de acción: `11px` (`text-zinc-500`)
* **Tarjetas de Tareas dentro del Cuadrante:**
  * Fondo: `#ffffff`
  * Padding: `14px 16px` (`p-3.5 sm:p-4`)
  * Borde: `1px solid #e4e4e7` (`border-zinc-200`)
  * Border radius: `rounded-xl` (`12px`)
  * Sombra: `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04)`
  * Espaciado entre tarjetas: `gap-3` (`12px`)
  * Checkbox circular / radio: `18px × 18px` (`w-4.5 h-4.5`), `rounded-full`, borde `1.5px`
  * Título de tarea: `14px` (`text-sm`), `font-medium`, `leading-snug`
  * Micro-badges (Tags & Vencimiento):
    * Altura: `22px` (`h-[22px]`)
    * Padding: `px-2.5 py-0.5`
    * Border radius: `rounded-md` (`6px`) o `rounded-full`
    * Tipografía: `11px` (`text-[11px] font-medium`)
  * Avatar de colaborador asignado:
    * Tamaño: `24px × 24px` (`w-6 h-6`), `rounded-full`, texto `10px font-semibold`
* **Botón "+ Añadir tarea a QX":**
  * Alto: `36px` (`h-9`)
  * Estilo: `w-full`, borde `1px dashed #d4d4d8`, `rounded-xl`, `text-xs font-medium`
* **Estado Vacío (Empty State, ej. Q4):**
  * Borde: `1.5px dashed #e4e4e7`, `rounded-xl`
  * Padding: `32px 16px`
  * Icono de verificación: `36px × 36px` en círculo de `bg-emerald-50`

---

## 6. Panel Lateral Derecho — Tareas Completadas

* **Ancho fijo:** `340px` (`w-[340px] flex-shrink-0`)
* **Contenedor:**
  * Fondo: `#ffffff` con borde `1px solid #e4e4e7`
  * Padding: `16px` (`p-4`)
  * Border radius: `rounded-2xl` (`16px`)
  * Sombra: `shadow-sm`
* **Cabecera del Panel:**
  * Altura: `36px`
  * Icono check: `20px × 20px`, verde
  * Título: `14px font-bold text-zinc-900`
  * Badge total (ej. "7"): `20px × 20px`, `rounded-full`, `bg-zinc-100 text-xs`
  * Selector desplegable ("Todas"): `h-7 px-2.5`, `rounded-lg`, `text-xs`
  * Botón papelera / limpiar: `28px × 28px`, `rounded-lg`
* **Items de Lista Completada:**
  * Altura: `40px` - `44px` (`h-10` a `h-11`)
  * Padding: `px-3 py-2`
  * Border radius: `rounded-xl` (`12px`)
  * Fondo: `#f9fafb` (hover: `#f3f4f6`)
  * Icono checkmark completado: `18px × 18px` en verde esmeralda (`#10b981`)
  * Texto: `13px` (`text-[13px] text-zinc-600 line-through truncate`)
* **Enlace inferior ("Ver historial de archivo completo"):**
  * Altura: `36px`
  * Padding: `pt-3 border-t border-zinc-100`
  * Tipografía: `12px font-medium text-primary`

---

## 7. Modal de Edición de Tarea (Especificación Overlay)

* **Backdrop:** `fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4`
* **Ventana del Modal:**
  * Ancho: `max-w-4xl` (`896px`), `w-full`
  * Alto: `max-h-[90vh]` con `overflow-y-auto`
  * Border radius: `rounded-2xl` (`16px` o `20px`)
  * Sombra: `shadow-2xl` (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)`)
* **Distribución Interna:**
  * Header superior: `px-6 py-4 border-b border-zinc-100`
  * Cuerpo en 2 columnas:
    * Columna izquierda (Campos principales): `w-[65%]` (`gap-5`)
    * Columna derecha (Metadatos): `w-[35%]` (`gap-4 border-l border-zinc-100 pl-6`)
  * Footer inferior: `px-6 py-4 border-t border-zinc-100 flex justify-between`
    * Botón Eliminar: `h-10 px-4 rounded-xl text-red-600 border border-red-200`
    * Botón Guardar: `h-10 px-5 rounded-xl bg-blue-600 text-white font-medium`

---

## 8. Escala de Tokens y Radios (Tailwind Cheat Sheet)

```css
/* Radios de esquinas */
--radius-sm: 6px;    /* rounded-md  -> Badges y botones pequeños */
--radius-md: 8px;    /* rounded-lg  -> Inputs secundarios, avatares cuadrados */
--radius-lg: 12px;   /* rounded-xl  -> Tarjetas de tareas, buscador, botones */
--radius-xl: 16px;   /* rounded-2xl -> Cuadrantes 2x2, contenedor de paneles */
--radius-full: 9999px; /* rounded-full -> Avatares circulares, badges pill */

/* Sombras (Box Shadow) */
--shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
--shadow-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
--shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);

/* Espaciados típicos */
--gap-tight: 8px;    /* gap-2 */
--gap-normal: 12px;  /* gap-3 */
--gap-cards: 16px;   /* gap-4 */
--gap-sections: 24px;/* gap-6 */
```
