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

## 🌐 Localización en Español (Regla Obligatoria)

> **REGLA DE ORO:** Todo texto visible en el panel de AdminJS **DEBE ESTAR EN ESPAÑOL**. Esto incluye nombres de recursos, grupos de navegación, etiquetas de campos, mensajes de sistema, acciones y botones. Nunca debe aparecer una palabra en inglés en la interfaz del panel.

### El Problema: Nombres derivados del modelo Prisma

AdminJS genera automáticamente el nombre visible de un recurso a partir del nombre del modelo en `schema.prisma`. Por ejemplo, el modelo `Project` genera la etiqueta **"Projects"** en el menú lateral. Esto **no es aceptable**; debe mostrarse **"Proyectos"**.

### La Solución: `locale.translations` en `setup.js`

AdminJS expone una propiedad `locale` en su configuración central que permite sobreescribir **todo** el texto de la interfaz. Esta configuración vive **exclusivamente** en `setup.js`.

```javascript
// backend/src/admin/setup.js

const admin = new AdminJS({
  // ...resto de la configuración
  locale: {
    language: "es",
    availableLanguages: ["es"],
    translations: {
      es: {
        // 1. Acciones globales (botones de acción de los registros)
        actions: {
          new:        "Nuevo",
          edit:       "Editar",
          show:       "Ver",
          delete:     "Eliminar",
          list:       "Listar",
          search:     "Buscar",
          bulkDelete: "Eliminar selección",
        },
        // 2. Botones y textos de la interfaz
        buttons: {
          save:                   "Guardar",
          addNewItem:             "Añadir elemento",
          filter:                 "Filtrar",
          applyChanges:           "Aplicar cambios",
          resetFilter:            "Restablecer filtros",
          logout:                 "Cerrar sesión",
          confirmRemoval:         "Confirmar eliminación",
          confirmRemovalMany:     "Confirmar eliminación de {{count}} registro(s)",
        },
        // 3. Mensajes del sistema
        messages: {
          successfullyCreated:          "Registro creado exitosamente",
          successfullyUpdated:          "Registro actualizado exitosamente",
          successfullyDeleted:          "Registro eliminado exitosamente",
          successfullyBulkDeleted:      "{{count}} registro(s) eliminado(s) exitosamente",
          thereWereValidationErrors:    "Hay errores de validación — revisa el formulario.",
          forbiddenError:               "No tienes permiso para realizar '{{ actionName }}' en '{{ resourceId }}'.",
          invalidCredentials:           "Correo electrónico o contraseña incorrectos.",
          noRecordsSelected:            "No se seleccionaron registros.",
          theseRecordsWillBeDeleted:    "Los siguientes registros serán eliminados:",
        },
        // 4. Traducciones específicas por recurso (¡AQUÍ SE EVITA EL INGLÉS!)
        resources: {
          Project: {
            name: "Proyecto",          // ← "Projects" → "Proyectos"
            properties: {
              id:                "ID",
              title:             "Título",
              slug:              "Slug (URL)",
              content:           "Contenido HTML",
              short_description: "Descripción Corta",
              cover_image:       "Imagen de Portada",
              technologies:      "Tecnologías",
              live_url:          "URL en Vivo",
              repo_url:          "URL del Repositorio",
              created_at:        "Fecha de Creación",
            },
            actions: {
              new:    "Nuevo Proyecto",
              edit:   "Editar Proyecto",
              show:   "Ver Proyecto",
              delete: "Eliminar Proyecto",
              list:   "Lista de Proyectos",
            },
          },
          Section: {
            name: "Sección",
            properties: {
              id:        "ID",
              slug:      "Slug (Identificador)",
              title:     "Título",
              body:      "Cuerpo HTML",
              image_url: "URL de Imagen",
            },
            actions: {
              new:    "Nueva Sección",
              edit:   "Editar Sección",
              show:   "Ver Sección",
              delete: "Eliminar Sección",
              list:   "Lista de Secciones",
            },
          },
          Admin: {
            name: "Administrador",
            properties: {
              id:            "ID",
              email:         "Correo Electrónico",
              password_hash: "Contraseña",
            },
            actions: {
              new:    "Nuevo Administrador",
              edit:   "Editar Administrador",
              show:   "Ver Administrador",
              delete: "Eliminar Administrador",
              list:   "Lista de Administradores",
            },
          },
        },
      },
    },
  },
});
```

### Regla al Añadir un Nuevo Recurso

**Cada vez que se registre un nuevo modelo en `setup.js`, se debe agregar obligatoriamente su bloque de traducciones en `locale.translations.es.resources`** con:

1. `name`: Nombre singular en español (ej: `"MenuItem"` → `"Ítem de Menú"`)
2. `properties`: Etiqueta española para cada campo del modelo
3. `actions`: Texto de cada acción en español

```javascript
// Ejemplo: nuevo modelo "MenuItem" en setup.js → locale.translations.es.resources
MenuItem: {
  name: "Ítem de Menú",
  properties: {
    id:       "ID",
    label:    "Etiqueta",
    path:     "Ruta (URL)",
    order:    "Orden",
    is_active:"Activo",
  },
  actions: {
    new:    "Nuevo Ítem",
    edit:   "Editar Ítem",
    show:   "Ver Ítem",
    delete: "Eliminar Ítem",
    list:   "Lista de Ítems de Menú",
  },
},
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
| Dejar el nombre de un recurso en inglés (ej: "Project", "Section") | Agregar la entrada en `locale.translations.es.resources` con `name` en español |
| Registrar un modelo nuevo sin bloque de traducciones | Siempre añadir `name`, `properties` y `actions` en español para cada recurso nuevo |
| Usar texto en inglés en `navigation.name` | Escribir siempre el grupo de navegación en español (ej: `"Gestión de Portafolio"`) |
| Usar `pages` para añadir "Inicio" dentro de "Panel de Control" | `pages` siempre crea una sección **separada** al fondo del sidebar. Para integrar en "Panel de Control" usar `componentLoader.override("SidebarResourceSection", ...)` |
| Usar íconos no verificados como `"Document"`, `"Navigationbar"` | Usar SOLO los nombres de la lista verificada de esta sección |

---

## 🗂️ Estado Real del Proyecto (fuente de verdad)

Esta sección refleja el estado actual de los recursos registrados. **Actualizar aquí ante cualquier cambio.**

### Estructura de archivos actual

```
backend/src/admin/
├── setup.js                          # Inicialización central, ComponentLoader, override, locale
└── components/
│   ├── SidebarNavigation.jsx         # ✅ Override de SidebarResourceSection — inyecta "Inicio"
│   │                                 #    como primer ítem de "Panel de Control" en el sidebar
│   ├── MenuReorder.jsx               # Interfaz drag-and-drop para reordenar MenuItems
│   └── HomeDashboard.jsx             # Reservado — redirige a /admin (sin uso activo)
└── resources/
    ├── admin.resource.js             # Modelo Admin  → grupo: "Administración", icon: "Shield"
    ├── project.resource.js           # Modelo Project → sin grupo (name: null), icon: "Briefcase"
    ├── section.resource.js           # Modelo Section → sin grupo (name: null), icon: "File"
    ├── menuitem.resource.js          # Modelo MenuItem → grupo: "Navegación", icon: "Navigation"
    └── footerblock.resource.js       # Modelo FooterBlock → grupo: "Navegación", icon: "List"
```

### Configuración de navegación actual

| Recurso | `navigation.name` | `navigation.icon` | Posición en sidebar |
|---|---|---|---|
| `Project` | `null` | `Briefcase` | Ítem top-level |
| `Section` | `null` | `File` | Ítem top-level |
| `MenuItem` | `"Navegación"` | `Navigation` | Dentro del grupo "Navegación" |
| `FooterBlock` | `"Navegación"` | `List` | Dentro del grupo "Navegación" |
| `Admin` | `"Administración"` | `Shield` | Dentro del grupo "Administración" |

### "Inicio" en el sidebar (ya implementado)

`"Inicio"` aparece como **primer ítem de "Panel de Control"** mediante el override de `SidebarResourceSection` en `setup.js`. Al hacer clic navega a `/admin` (mismo destino que el logo "Claudio Salazar").

---

## 🎨 Iconos Feather Verificados en AdminJS v7

> **CRÍTICO:** AdminJS v7 usa la librería **Feather Icons**. Solo los nombres de esta lista están garantizados. Usar nombres no listados produce un ícono ⊘ (prohibition).

Los nombres son **PascalCase** (primera letra mayúscula).

```
✅ Briefcase    ← Portafolio, trabajos
✅ File         ← Documentos, secciones  (CORRECTO para Section)
✅ FileText     ← Documentos con texto
✅ Shield       ← Administración, seguridad
✅ Home         ← Dashboard, inicio
✅ Image        ← Imágenes, medios
✅ List         ← Listas, footer items
✅ Tag          ← Etiquetas, categorías
✅ Link         ← URLs, vínculos
✅ Mail         ← Contacto, email
✅ Star         ← Destacados, rating
✅ Eye          ← Vista previa
✅ Edit         ← Edición
✅ Trash        ← Eliminación
✅ User         ← Usuarios, perfil
✅ Users        ← Grupos de usuarios
✅ Settings     ← Configuración
✅ Navigation   ← Menú, navegación  (CORRECTO para MenuItem)
✅ Menu         ← Hamburguesa, menú
✅ Globe        ← Sitio web, internacional
✅ Code         ← Desarrollo, código
✅ Package      ← Paquetes, módulos
✅ Layers       ← Capas, colecciones
✅ Grid         ← Cuadrícula, dashboard
✅ Layout       ← Plantillas, layouts
✅ Sidebar      ← Panel lateral
✅ MessageCircle ← Comentarios
✅ Info         ← Información, ayuda
✅ AlertCircle  ← Alertas
✅ CheckCircle  ← Estados activos/completados
✅ Sort         ← Ordenamiento (usado en acciones personalizadas)

❌ Document         → NO EXISTE, usar File o FileText
❌ Navigationbar    → NO EXISTE, usar Navigation o Menu
❌ Page             → NO EXISTE, usar File
❌ Database         → NO EXISTE en Feather, usar Layers o Grid
❌ Content          → NO EXISTE, usar FileText
```

---

## 📄 Cómo añadir un ítem en "Panel de Control" vs sección separada

> **Diferencia crítica entre `pages` y `SidebarResourceSection` override:**

| Método | Resultado visual | Cuándo usarlo |
|---|---|---|
| `componentLoader.override("SidebarResourceSection", ...)` | El ítem aparece **dentro de "Panel de Control"** | Ítems de navegación integrados (ej: "Inicio") |
| `pages: { ... }` en AdminJS config | Crea una sección **separada "PÁGINAS"** al fondo del sidebar | Páginas de herramientas auxiliares (no navegación principal) |

### Patrón actual: "Inicio" dentro de "Panel de Control"

En `setup.js` el override se declara **fuera** de `setupAdmin()`:

```javascript
const componentLoader = new ComponentLoader();

const Components = {
  MenuReorder: componentLoader.add("MenuReorder", ...),
  // NO registrar aquí el componente del sidebar override
};

// El override se hace directamente sobre componentLoader:
componentLoader.override(
  "SidebarResourceSection",
  path.resolve(__dirname, "./components/SidebarNavigation")
);
```

El componente `SidebarNavigation.jsx` recibe `{ resources }` como props y usa `useNavigationResources` para inyectar "Inicio" como primer elemento:

```jsx
// src/admin/components/SidebarNavigation.jsx
import React, { useMemo } from "react";
import { Navigation } from "@adminjs/design-system";
import { useNavigationResources, useTranslation } from "adminjs";
import { useLocation, useNavigate } from "react-router";

const SidebarNavigation = ({ resources }) => {
  const elements = useNavigationResources(resources); // ← recursos normales del panel
  const { translateLabel } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const rootPath = "/admin";
  const isHomeSelected = location.pathname === rootPath || location.pathname === rootPath + "/";

  const homeElement = useMemo(() => ({
    id: "__dashboard__",
    label: "Inicio",
    icon: "Home",
    href: rootPath,
    isSelected: isHomeSelected,
    onClick: (event) => {
      event.preventDefault();
      navigate(rootPath); // ← mismo destino que el logo "Claudio Salazar"
    },
  }), [isHomeSelected, navigate]);

  // "Inicio" primero, luego el resto
  const allElements = [homeElement, ...elements];

  return (
    <Navigation
      label={translateLabel("navigation")}
      elements={allElements}
    />
  );
};

export default SidebarNavigation;
```

---

## ⚙️ ComponentLoader — Registro de Componentes React

El `ComponentLoader` es la interfaz para integrar componentes React de AdminJS. Solo se instancia **una vez** en `setup.js`.

```javascript
import AdminJS, { ComponentLoader } from "adminjs";

const componentLoader = new ComponentLoader();

// Registrar un componente nuevo:
const Components = {
  NombreComponente: componentLoader.add(
    "NombreComponente",          // nombre clave (usado en resourceOptions o pages)
    path.resolve(__dirname, "./components/NombreComponente")  // SIN extensión .jsx
  ),
};

// Pasar el ID a recursos que lo necesiten:
options: getRecursoResourceOptions(Components),
```

### `componentLoader.override()` — nombres verificados en AdminJS v7

```javascript
// ✅ Nombres de override VERIFICADOS y en uso en este proyecto:
componentLoader.override("SidebarResourceSection", // ← sección de recursos del sidebar
  path.resolve(__dirname, "./components/SidebarNavigation"));

// ✅ Otros overrides válidos en AdminJS v7:
componentLoader.override("Login",     path.resolve(__dirname, "./components/CustomLogin"));
componentLoader.override("Dashboard", path.resolve(__dirname, "./components/CustomDashboard"));

// ❌ Nombres que NO existen como override:
// componentLoader.override("Sidebar", ...)    // no existe
// componentLoader.override("Navigation", ...) // no existe
```

> **Regla:** Para ítems en "Panel de Control" usa `componentLoader.override("SidebarResourceSection", ...)`. Para secciones auxiliares completamente separadas usa `pages`.

---

## 🔗 Hooks de Ciclo de Vida en Acciones (`before` / `after`)

Las acciones de AdminJS (`new`, `edit`, `delete`, y acciones personalizadas) admiten hooks que se ejecutan antes o después del handler principal. Esto permite sincronizar datos entre modelos.

### Patrón `after` (usado en `section.resource.js`)

```javascript
actions: {
  new: {
    // Se ejecuta DESPUÉS de que AdminJS guarda el registro
    after: [
      async (response) => {
        // Verificar que la operación fue exitosa (sin errores de validación)
        const { params, errors } = response.record ?? {};
        if (params && !Object.keys(errors ?? {}).length) {
          const { slug, title } = params;
          // Lógica de sincronización con otro modelo:
          if (slug && title) await upsertMenuItem(slug, title);
        }
        return response; // SIEMPRE retornar response
      },
    ],
  },
  edit: {
    after: [
      async (response) => {
        // Mismo patrón para actualizaciones
        return response;
      },
    ],
  },
  delete: {
    after: [
      async (request, response, context) => {
        // context.record.params.slug para obtener datos del registro eliminado
        return response;
      },
    ],
  },
},
```

> **Regla:** Los hooks `after` **siempre** deben retornar `response`. Los hooks `before` **siempre** deben retornar `request`.

### Caso de uso real: Sección → MenuItem vinculado

El recurso `Section` usa `after` hooks en `new`, `edit` y `delete` para sincronizar automáticamente el ítem de menú correspondiente. Esto evita que el usuario deba crear el MenuItem manualmente cada vez que crea una Sección.

---

## 🎬 Acciones Personalizadas de Tipo Página

Para acciones que renderizan un componente React propio (ej: pantalla drag-and-drop), se usa `actionType: "resource"` con `component`:

```javascript
// En el archivo de resource (ej: menuitem.resource.js):
actions: {
  reorderMenu: {
    actionType: "resource",    // acción de nivel de recurso (no por registro individual)
    label: "⠿ Reordenar",
    icon: "Sort",
    component: components.MenuReorder,  // ID del componente registrado en ComponentLoader
    handler: async (request, response, context) => {
      // Devuelve datos que el componente React puede consumir via props
      return { records: context.records ?? [] };
    },
  },
},
```

El componente recibe `{ record, resource, action }` como props desde AdminJS.

---

## 🏷️ `navigation.name: null` — Ítems de Nivel Superior

Cuando `navigation.name` es `null`, el recurso **no se agrupa** y aparece como ítem directo en el sidebar bajo el título "Panel de Control" (configurado en `locale.translations.es.labels.navigation`).

```javascript
// Ítem al nivel raíz del sidebar:
navigation: { name: null, icon: "File" }    // ← sin grupo

// Ítem dentro de un grupo:
navigation: { name: "Navegación", icon: "Navigation" }  // ← agrupado
```

**Regla de agrupación:** Si dos recursos comparten el mismo `navigation.name` (ej: `"Navegación"`), AdminJS los agrupa automáticamente bajo un único encabezado. El icono del grupo lo define el **primer recurso registrado** con ese nombre en el array `resources` de `setup.js`.

---



## 🔗 Referencias

- [Documentación oficial de AdminJS — ResourceOptions](https://docs.adminjs.co/api/resourceoptions)
- [AdminJS v7 — Pages API](https://docs.adminjs.co/basics/customization/custom-pages)
- [AdminJS v7 — ComponentLoader](https://docs.adminjs.co/basics/customization/custom-components)
- [AdminJS v7 — Action Hooks (before/after)](https://docs.adminjs.co/basics/action#hooks)
- [Feather Icons — lista completa](https://feathericons.com/)
- [Adaptador @adminjs/prisma](https://docs.adminjs.co/installation/adapters/prisma)
- [Contrato API del proyecto](../../../../docs/API_CONTRACT.md)
- [Schema de Prisma](../../../prisma/schema.prisma)
- [Punto de entrada del panel](../../../src/admin/setup.js)
- [Componente HomeDashboard](../../../src/admin/components/HomeDashboard.jsx)
- [Componente MenuReorder](../../../src/admin/components/MenuReorder.jsx)
