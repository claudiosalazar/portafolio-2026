# Skill: Configuración de Recursos en AdminJS

## 📌 Propósito

Este documento define el patrón estándar para crear, configurar y registrar recursos (modelos de Prisma) en el panel de administración **AdminJS** de este proyecto. Debe consultarse obligatoriamente antes de añadir o modificar cualquier modelo en el panel.

---

## 🏗️ Arquitectura del Panel

El panel de administración sigue una separación estricta de responsabilidades:

```
backend/src/admin/
├── setup.js                    # Inicialización central de AdminJS
└── resources/
    ├── admin.resource.js       # Opciones del modelo Admin
    ├── project.resource.js     # Opciones del modelo Project
    └── section.resource.js     # Opciones del modelo Section
```

**Regla de oro:** cada modelo de Prisma tiene su propio archivo `[nombre].resource.js`. La lógica de configuración **nunca** se escribe directamente en `setup.js`.

---

## 🔌 Stack y Adaptador

El panel usa el adaptador oficial de Prisma para AdminJS:

```javascript
import AdminJS from "adminjs";
import { Database, Resource } from "@adminjs/prisma";

// Registro del adaptador (se hace UNA sola vez en setup.js)
AdminJS.registerAdapter({ Database, Resource });
```

Los modelos se obtienen directamente del DMMF (Data Model Meta Format) de Prisma, lo que evita importar el cliente de Prisma por modelo:

```javascript
import { Prisma } from "@prisma/client";

const models = Prisma.dmmf.datamodel.models;
// Luego: models.find(m => m.name === "NombreModelo")
```

---

## 📐 Patrón de un Archivo de Recurso

Cada archivo `[nombre].resource.js` exporta un objeto de opciones con tipo JSDoc para autocompletado:

```javascript
/** @type {import('adminjs').ResourceOptions} */
export const NombreModeloResourceOptions = {
  navigation: { name: "Nombre del Grupo", icon: "NombreIcono" },
  listProperties: ["campo1", "campo2"],
  filterProperties: ["campo1"],
  properties: {
    campo1: { /* configuración */ },
  },
};
```

---

## ⚙️ Propiedades de Configuración

### `navigation`
Agrupa los recursos en el menú lateral del panel.

```javascript
navigation: { name: "Gestión de Portafolio", icon: "Briefcase" }
```

Iconos disponibles (de la librería Feather Icons integrada en AdminJS):
`Briefcase`, `Document`, `Shield`, `User`, `Settings`, `Home`, `Image`, `List`, `Tag`, `Link`, `Mail`, `Star`, `Eye`, `Edit`, `Trash`

---

### `listProperties`
Define qué columnas se muestran en la vista de lista (tabla principal).

```javascript
listProperties: ["id", "title", "slug", "created_at"]
```

> Mantener entre 3 y 5 campos para no sobrecargar la tabla.

---

### `filterProperties`
Define qué campos aparecen en el panel de filtros de la lista.

```javascript
filterProperties: ["title", "slug", "technologies"]
```

---

### `properties`
Objeto donde se configura el comportamiento de cada campo individualmente.

#### Tipos de campo (`type`)

| Tipo | Cuándo usarlo | Ejemplo en el proyecto |
|---|---|---|
| `richtext` | Texto largo con formato HTML | `content` en Project, `body` en Section |
| `textarea` | Texto largo sin formato | `short_description` en Project |
| `mixed` + `isArray: true` | Arrays de strings (JSON en DB) | `technologies` en Project |
| `string` | Texto simple (tipo por defecto) | `title`, `slug`, `email` |
| `boolean` | Valores verdadero/falso | — |
| `datetime` | Fechas | `created_at` |

#### Visibilidad de campos (`isVisible`)

Controla en qué vistas aparece un campo:

```javascript
campo: {
  isVisible: {
    list:   true,   // ¿Visible en la tabla?
    show:   true,   // ¿Visible en la vista de detalle?
    edit:   false,  // ¿Editable en el formulario?
    filter: true,   // ¿Disponible como filtro?
  }
}
```

**Caso de uso real — campo `created_at`:**
```javascript
created_at: {
  isVisible: { edit: false, show: true, list: true, filter: true },
}
```
Se muestra en todas partes pero no es editable manualmente.

**Caso de uso real — campo `password_hash`:**
```javascript
password_hash: {
  isVisible: { list: false, show: false, edit: true, filter: false },
}
```
Solo aparece en el formulario de edición, nunca se expone en listados.

#### Descripción de ayuda
```javascript
slug: {
  description: "URL amigable (ej: mi-proyecto-genial). No uses espacios.",
}
```

---

## 📋 Recursos Actuales del Proyecto

### `Admin` (`admin.resource.js`)
- **Grupo de navegación:** Administración (ícono: Shield)
- **Lista:** `id`, `email`
- **Filtros:** `email`
- **Restricción especial:** `password_hash` solo visible en edición; nunca expuesto en lista ni detalle.

```javascript
/** @type {import('adminjs').ResourceOptions} */
export const AdminResourceOptions = {
  navigation: { name: "Administración", icon: "Shield" },
  listProperties: ["id", "email"],
  filterProperties: ["email"],
  properties: {
    password_hash: {
      isVisible: { list: false, show: false, edit: true, filter: false },
    },
  },
};
```

---

### `Project` (`project.resource.js`)
- **Grupo de navegación:** Gestión de Portafolio (ícono: Briefcase)
- **Lista:** `id`, `title`, `slug`, `created_at`
- **Filtros:** `title`, `slug`, `technologies`
- **Campos especiales:**
  - `content` → `richtext` (editor HTML completo)
  - `short_description` → `textarea`
  - `technologies` → `mixed` + `isArray: true` (array de strings en JSON)
  - `created_at` → no editable manualmente

```javascript
/** @type {import('adminjs').ResourceOptions} */
export const ProjectResourceOptions = {
  navigation: { name: "Gestión de Portafolio", icon: "Briefcase" },
  listProperties: ["id", "title", "slug", "created_at"],
  filterProperties: ["title", "slug", "technologies"],
  properties: {
    content: { type: "richtext" },
    short_description: { type: "textarea" },
    cover_image: {
      description: "Ingresa la URL pública de la imagen.",
    },
    slug: {
      description: "URL amigable (ej: mi-proyecto-genial). No uses espacios.",
    },
    created_at: {
      isVisible: { edit: false, show: true, list: true, filter: true },
    },
    technologies: {
      type: "mixed",
      isArray: true,
    },
  },
};
```

---

### `Section` (`section.resource.js`)
- **Grupo de navegación:** Contenido Estático (ícono: Document)
- **Lista:** `id`, `slug`, `title`
- **Filtros:** `slug`, `title`
- **Campos especiales:**
  - `body` → `richtext` (editor HTML completo)
  - `image_url` → campo opcional con descripción de ayuda

```javascript
/** @type {import('adminjs').ResourceOptions} */
export const SectionResourceOptions = {
  navigation: { name: "Contenido Estático", icon: "Document" },
  listProperties: ["id", "slug", "title"],
  filterProperties: ["slug", "title"],
  properties: {
    body: { type: "richtext" },
    slug: {
      description: "Identificador único de la sección (ej: hero-inicio, sobre-mi).",
    },
    image_url: {
      description: "URL pública de la imagen de esta sección (opcional).",
    },
  },
};
```

---

## ➕ Cómo Añadir un Nuevo Recurso

Cuando se crea un nuevo modelo en `prisma/schema.prisma`, seguir este procedimiento en orden:

### Paso 1 — Crear el archivo de opciones

```javascript
// backend/src/admin/resources/nuevo-modelo.resource.js

/** @type {import('adminjs').ResourceOptions} */
export const NuevoModeloResourceOptions = {
  navigation: { name: "Grupo Correspondiente", icon: "NombreIcono" },
  listProperties: ["id", "campo_principal", "created_at"],
  filterProperties: ["campo_principal"],
  properties: {
    campo_texto_largo: { type: "richtext" },
    campo_fecha: {
      isVisible: { edit: false, show: true, list: true, filter: true },
    },
  },
};
```

### Paso 2 — Registrar el recurso en `setup.js`

```javascript
// backend/src/admin/setup.js

import { NuevoModeloResourceOptions } from "./resources/nuevo-modelo.resource.js";

// Dentro del array `resources` de new AdminJS({...}):
{
  resource: {
    model: models.find(m => m.name === "NuevoModelo"), // Nombre exacto del modelo en schema.prisma
    client: prisma,
  },
  options: NuevoModeloResourceOptions,
},
```

### Paso 3 — Actualizar el API Contract

Reflejar el nuevo modelo y sus endpoints en [`/docs/API_CONTRACT.md`](../../../../docs/API_CONTRACT.md).

---

## 🚫 Reglas y Anti-patrones

| ❌ No hacer | ✅ Hacer en su lugar |
|---|---|
| Escribir opciones directamente en `setup.js` | Crear un archivo separado `[modelo].resource.js` |
| Exponer `password_hash` en lista o detalle | Usar `isVisible: { list: false, show: false }` |
| Usar `type: "string"` para campos de contenido largo | Usar `type: "richtext"` o `type: "textarea"` según el caso |
| Añadir un modelo sin actualizar `API_CONTRACT.md` | Siempre sincronizar el contrato tras cualquier cambio de schema |
| Mostrar más de 5 columnas en `listProperties` | Limitar a los campos más relevantes (id + 3-4 campos clave) |

---

## 🔗 Referencias

- [Documentación oficial de AdminJS — ResourceOptions](https://docs.adminjs.co/api/resourceoptions)
- [Adaptador @adminjs/prisma](https://docs.adminjs.co/installation/adapters/prisma)
- [Contrato API del proyecto](../../../../docs/API_CONTRACT.md)
- [Schema de Prisma](../../../prisma/schema.prisma)
- [Punto de entrada del panel](../../../src/admin/setup.js)
