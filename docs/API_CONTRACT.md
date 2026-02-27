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
* `short_description` (Texto) - Para las tarjetas del inicio.
* `content` (Texto Largo) - Contenido detallado del proyecto.
* `cover_image` (Texto) - URL de la imagen principal.
* `technologies` (Array de Texto) - Ej: ["Node.js", "Next.js", "GSAP"].
* `live_url` (Texto, Opcional) - Link al sitio funcionando.

### Modelo: `Section` (Contenido de Páginas)
* `id` (Número)
* `slug` (Texto) - Identificador único, ej: "hero-inicio", "sobre-mi".
* `title` (Texto) - El título de esa sección.
* `body` (Texto Largo/HTML) - Párrafos o listas.

## 🛣️ 4. Endpoints Definidos
* `GET /api/content/:slug`: Retorna los textos de una sección específica (ej. `/api/content/sobre-mi`).

### A. Proyectos
* `GET /api/projects`: Retorna la lista de todos los proyectos (soporta `?featured=true`).
* `GET /api/projects/:slug`: Retorna los detalles de un solo proyecto buscando por su slug.