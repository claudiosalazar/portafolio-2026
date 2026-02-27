# Skill: Creación de Endpoints en la API REST

## 📌 Propósito

Este documento define el patrón estándar para crear nuevos endpoints en el backend. Debe consultarse obligatoriamente antes de añadir cualquier ruta, controlador o servicio nuevo. Cubre desde endpoints simples hasta flujos completos con capas separadas.

---

## 🏗️ Decisión de Arquitectura: ¿Cuántas capas necesito?

El backend define una arquitectura de capas en `src/ARCHITECTURE.md`, pero **no todos los endpoints requieren todas las capas**. La regla para decidir es:

| Situación | Patrón a usar |
|---|---|
| Endpoint de solo lectura simple (1 query, sin transformaciones) | **Fat Route** — lógica directamente en `routes/` |
| Endpoint con lógica condicional, múltiples queries o transformaciones | **Route → Controller → Service** |
| Endpoint que recibe datos del cliente (POST, PUT, PATCH) | **Route → Controller → Validator → Service** |
| Lógica que se reutiliza en más de un endpoint | **Service obligatorio** |

> Los endpoints actuales (`GET /api/projects`, `GET /api/projects/:slug`, `GET /api/content/:slug`) usan el patrón **Fat Route** porque son lecturas simples. Es correcto mantenerlos así mientras no crezcas en complejidad.

---

## 🔧 Herramientas Base Disponibles

Antes de escribir cualquier endpoint, estos dos módulos ya existen y **deben usarse siempre**:

### `lib/prisma.js` — Cliente singleton de Prisma

```javascript
import prisma from "../lib/prisma.js";

// Uso directo:
const projects = await prisma.project.findMany();
const section  = await prisma.section.findUnique({ where: { slug: "sobre-mi" } });
```

> Nunca instancies `new PrismaClient()` dentro de una ruta o servicio. Siempre importa el singleton.

---

### `lib/response.js` — Helpers de respuesta estandarizada

Toda respuesta de la API **debe** pasar por estos helpers para respetar el contrato `{ success, data }` / `{ success, error, message }`:

```javascript
import { sendSuccess, sendError } from "../lib/response.js";

// Respuesta exitosa (200 por defecto)
sendSuccess(res, data);
sendSuccess(res, data, 201); // Creado

// Respuesta de error (500 por defecto)
sendError(res, "CÓDIGO_ERROR", "Mensaje legible para el cliente.");
sendError(res, "NOT_FOUND",    "No encontrado.", 404);
sendError(res, "BAD_REQUEST",  "Datos inválidos.", 400);
```

**Convención para códigos de error:** `NOMBRE_MODELO_TIPO_ERROR` en mayúsculas y snake_case.

| Ejemplo de código | Cuándo usarlo |
|---|---|
| `PROJECT_NOT_FOUND` | Recurso no encontrado (404) |
| `PROJECT_FETCH_ERROR` | Fallo inesperado al leer DB (500) |
| `PROJECT_CREATE_ERROR` | Fallo inesperado al escribir DB (500) |
| `INVALID_SLUG` | Parámetro de ruta inválido (400) |
| `VALIDATION_ERROR` | Body del request inválido (400) |

---

## 📐 Patrón 1: Fat Route (lectura simple)

Úsalo cuando el endpoint es una consulta directa a Prisma sin transformaciones.

```javascript
// backend/src/routes/ejemplo.js
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { sendSuccess, sendError } from "../lib/response.js";

const router = Router();

// GET /api/ejemplo/:slug
router.get("/:slug", async (req, res) => {
  try {
    const registro = await prisma.nombreModelo.findUnique({
      where: { slug: req.params.slug },
    });

    if (!registro) {
      return sendError(res, "REGISTRO_NOT_FOUND", "El registro no fue encontrado.", 404);
    }

    return sendSuccess(res, registro);
  } catch (error) {
    console.error("Error al obtener registro:", error);
    return sendError(res, "REGISTRO_FETCH_ERROR", "No se pudo obtener el registro.");
  }
});

export default router;
```

---

## 📐 Patrón 2: Route → Controller → Service (lógica compleja)

Úsalo cuando hay transformaciones, múltiples queries, reutilización de lógica o recepción de datos del cliente.

### Paso 1 — Service (`src/services/`)

El servicio contiene la lógica de negocio pura. **No conoce Express** (`req`, `res`). Solo trabaja con datos y Prisma.

```javascript
// backend/src/services/project.service.js
import prisma from "../lib/prisma.js";

export class ProjectService {

  static async getAll(filters = {}) {
    const where = {};
    // Ejemplo de lógica de negocio: filtro opcional
    if (filters.featured) {
      where.is_featured = true;
    }
    return await prisma.project.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }

  static async getBySlug(slug) {
    return await prisma.project.findUnique({
      where: { slug },
    });
  }
}
```

### Paso 2 — Controller (`src/controllers/`)

El controlador maneja el contexto HTTP: extrae parámetros de `req`, llama al servicio y devuelve la respuesta con los helpers.

```javascript
// backend/src/controllers/project.controller.js
import { ProjectService } from "../services/project.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllProjects(req, res) {
  try {
    const projects = await ProjectService.getAll(req.query);
    return sendSuccess(res, projects);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return sendError(res, "PROJECTS_FETCH_ERROR", "No se pudieron obtener los proyectos.");
  }
}

export async function getProjectBySlug(req, res) {
  try {
    const project = await ProjectService.getBySlug(req.params.slug);

    if (!project) {
      return sendError(res, "PROJECT_NOT_FOUND", "El proyecto no fue encontrado.", 404);
    }

    return sendSuccess(res, project);
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return sendError(res, "PROJECT_FETCH_ERROR", "No se pudo obtener el proyecto.");
  }
}
```

### Paso 3 — Route (`src/routes/`)

La ruta solo registra la URL y asigna el controlador. **No contiene lógica**.

```javascript
// backend/src/routes/projects.js
import { Router } from "express";
import { getAllProjects, getProjectBySlug } from "../controllers/project.controller.js";

const router = Router();

router.get("/",      getAllProjects);
router.get("/:slug", getProjectBySlug);

export default router;
```

### Paso 4 — Registrar la ruta en `index.js`

```javascript
// backend/src/index.js
import projectsRouter from "./routes/projects.js";
app.use("/api/projects", projectsRouter);
```

---

## ✅ Patrón 3: Validación de datos de entrada (POST / PUT)

Cuando un endpoint recibe datos del cliente en el `body`, añade una función validadora antes del controlador.

```javascript
// backend/src/validators/project.validator.js

/**
 * Valida el body para crear o actualizar un Project.
 * Devuelve un array de errores (vacío si todo es válido).
 * @param {object} body
 * @returns {string[]}
 */
export function validateProjectBody(body) {
  const errors = [];
  if (!body.title?.trim())             errors.push("El campo 'title' es obligatorio.");
  if (!body.slug?.trim())              errors.push("El campo 'slug' es obligatorio.");
  if (!body.short_description?.trim()) errors.push("El campo 'short_description' es obligatorio.");
  if (!Array.isArray(body.technologies) || body.technologies.length === 0) {
    errors.push("El campo 'technologies' debe ser un array con al menos un elemento.");
  }
  return errors;
}
```

**Uso en el controller:**

```javascript
import { validateProjectBody } from "../validators/project.validator.js";

export async function createProject(req, res) {
  const errors = validateProjectBody(req.body);
  if (errors.length > 0) {
    return sendError(res, "VALIDATION_ERROR", errors.join(" "), 400);
  }

  try {
    const project = await ProjectService.create(req.body);
    return sendSuccess(res, project, 201);
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    return sendError(res, "PROJECT_CREATE_ERROR", "No se pudo crear el proyecto.");
  }
}
```

---

## 📋 Checklist al crear un nuevo endpoint

Antes de dar por terminado cualquier endpoint, verificar:

- [ ] La ruta usa `sendSuccess` / `sendError` de `lib/response.js` — nunca `res.json()` directo
- [ ] El cliente Prisma viene del singleton `lib/prisma.js` — nunca se instancia localmente
- [ ] Todos los errores tienen un bloque `try/catch` con `console.error` y `sendError`
- [ ] Los recursos no encontrados devuelven `404`, no `200` con `data: null`
- [ ] Si recibe datos del cliente, existe un validador en `validators/`
- [ ] La ruta está registrada en `src/index.js`
- [ ] El endpoint está documentado en [`/docs/API_CONTRACT.md`](../../../docs/API_CONTRACT.md) ← **obligatorio**

---

## 🚫 Anti-patrones

| ❌ No hacer | ✅ Hacer en su lugar |
|---|---|
| `res.json({ data: proyecto })` | `sendSuccess(res, proyecto)` |
| `res.status(404).json({ error: "..." })` | `sendError(res, "NOT_FOUND", "...", 404)` |
| `new PrismaClient()` dentro de una ruta | Importar `prisma` desde `lib/prisma.js` |
| Lógica de negocio dentro de la ruta | Moverla a un `Service` |
| Endpoint nuevo sin actualizar `API_CONTRACT.md` | Siempre sincronizar el contrato |
| `catch (e) {}` silencioso | `console.error(...)` + `sendError(...)` siempre |

---

## 🔗 Referencias internas

- [Helpers de respuesta](../../src/lib/response.js)
- [Cliente Prisma singleton](../../src/lib/prisma.js)
- [Rutas existentes (referencia)](../../src/routes/)
- [Arquitectura de capas](../../src/ARCHITECTURE.md)
- [Contrato API](../../../docs/API_CONTRACT.md)
