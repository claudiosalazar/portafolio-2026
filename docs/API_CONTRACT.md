# 🤝 Contrato API (API_CONTRACT) - Claudio Salazar Portfolio

Este documento define la estructura estricta de comunicación entre el Backend (Node.js) y el Frontend (Next.js). Ningún agente debe modificar los endpoints o los esquemas de datos sin actualizar este archivo primero.

## 🌍 1. Entornos y URLs Base

* **Frontend (Sitio Público):** `https://claudiosalazar.cl/`
* **Backend (API REST):** `https://api.claudiosalazar.cl/`
* **Panel de Admin (AdminJS):** `https://admin.claudiosalazar.cl/`

## 📦 2. Estructura Global de Respuestas

**Respuesta Exitosa (200 OK):**
{
  "success": true,
  "data": { ... }
}

**Respuesta de Error (4xx o 5xx):**
{
  "success": false,
  "error": "Código del error",
  "message": "Descripción del error"
}

## 🗄️ 3. Modelos de Datos (MariaDB -> JSON)

### Modelo: `Admin` (Datos admin)
* `id`
* `email`
* `password_hash`

### Modelo: `Project` (Proyectos del Portafolio)
El Frontend (Next.js) espera recibir exactamente esta estructura para armar las cards y la vista de detalle:

* `id` (Número)
* `created_at` (Fecha)
* `title` (Texto) - Ej: "Generador de Imágenes IA"
* `slug` (Texto) - Ej: "generador-imagenes-ia" (Para las URLs limpias)
* `project_type` (Texto) - Valores posibles: `"development"` | `"design"`
* `short_description` (Texto) - Para las tarjetas del inicio.
* `content` (Texto Largo) - Contenido detallado del proyecto.
* `images` (Array de Texto) - URLs completas de las imágenes del proyecto (máx. 5). Ej: `["https://api.claudiosalazar.cl/images/development/foto-1.jpg"]`. El array puede estar vacío si no hay imágenes.
* `technologies` (Array de Texto) - Ej: `["Node.js", "Next.js", "GSAP"]`. Derivado del campo `technologies` en DB (texto separado por comas).
* `live_url` (Texto, Opcional) - Link al proyecto funcionando.

> **Nota de almacenamiento:** En la DB, las imágenes se guardan como rutas relativas (`{type}/{nombre-archivo}.ext`) en los campos `image_1` … `image_5`. La API construye las URLs completas en `https://api.claudiosalazar.cl/images/{ruta}`. Los archivos físicos residen en `/backend/upload/{design|development}/`.

### Modelo: `Section` (Contenido de Páginas)
* `id` (Número)
* `slug` (Texto) - Identificador único, ej: "hero-inicio", "sobre-mi".
* `title` (Texto) - El título de esa sección.
* `body` (Texto Largo/HTML) - Párrafos o listas.

### Modelo: `MenuItem` (Menú de Navegación Principal)
* `id` (Número)
* `label` (Texto) - Texto visible en el menú (ej: "Inicio", "Proyectos").
* `url` (Texto) - Ruta de destino (ej: `/proyectos`, `https://...`).
* `image_url` (Texto, Opcional) - URL de imagen o logo para mostrar junto al ítem.
* `order` (Número) - Posición en el menú. Menor = primero.
* `is_active` (Booleano) - Si es `false`, no se expone en la API.
* `source_slug` (Texto, Opcional) - Slug de la `Section` que lo originó. Si tiene valor, el ítem es auto-gestionado. **No se expone en el endpoint público.**

### Modelo: `FooterBlock` (Bloques del Footer)
* `id` (Número)
* `group` (Texto) - Categoría del bloque. Valores posibles: `"social"`, `"enlaces"`, `"contacto"`, `"legal"`.
* `label` (Texto) - Texto visible del ítem.
* `url` (Texto, Opcional) - Enlace de destino.
* `icon` (Texto, Opcional) - Nombre del icono (dependiente de la librería del frontend).
* `order` (Número) - Posición dentro de su grupo.
* `is_active` (Booleano) - Si es `false`, no se expone en la API.

## 🛣️ 4. Endpoints Definidos

### A. Proyectos
* `GET /api/projects`: Retorna la lista de todos los proyectos (soporta `?featured=true`).
* `GET /api/projects/:slug`: Retorna los detalles de un solo proyecto buscando por su slug.

### B. Contenido Estático
* `GET /api/content/:slug`: Retorna los textos de una sección específica (ej. `/api/content/sobre-mi`).

### C. Navegación
* `GET /api/navigation/menu`: Retorna todos los ítems activos del menú principal ordenados por `order`. _(Uso público - frontend)_
  ```json
  { "success": true, "data": [{ "id": 1, "label": "Inicio", "url": "/", "image_url": null, "order": 0 }] }
  ```
* `GET /api/navigation/menu/all`: Retorna TODOS los ítems (activos e inactivos) con todos los campos. _(Uso interno - panel admin)_
* `PATCH /api/navigation/menu/reorder`: Actualiza el campo `order` de múltiples ítems en una transacción. Recibe `{ items: [{id, order}] }`. _(Uso interno - panel admin)_
* `GET /api/navigation/footer`: Retorna los bloques activos del footer agrupados por `group`.
  ```json
  { "success": true, "data": { "social": [...], "enlaces": [...] } }
  ```