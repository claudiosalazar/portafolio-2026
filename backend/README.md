# Backend — Portafolio Web Claudio Salazar

API REST y panel de administración del portafolio de Claudio Salazar. Construido con **Node.js + Express**, expone los datos del portafolio a través de endpoints JSON consumidos exclusivamente por el frontend Next.js. Incluye un panel CMS integrado gestionado con **AdminJS**.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js + Express | ^5.2 | Servidor HTTP y enrutamiento |
| Prisma ORM | ^6.19 | Abstracción y migraciones de base de datos |
| MariaDB | — | Base de datos relacional (alojada en NameHero) |
| AdminJS | ^7.8 | Panel de administración / CMS |
| @adminjs/prisma | ^5.0 | Adaptador de Prisma para AdminJS |
| @adminjs/express | ^6.1 | Integración de AdminJS con Express |
| dotenv | ^17 | Gestión de variables de entorno |

---

## 🌐 URLs del Servicio

| Entorno | URL |
|---|---|
| API (Producción) | `https://api.claudiosalazar.cl/` |
| Panel Admin (Producción) | `https://admin.claudiosalazar.cl/` |
| API (Local) | `http://localhost:5001` |
| Panel Admin (Local) | `http://localhost:5001/admin` |

---

## 📂 Estructura de Carpetas

```
backend/src/
├── admin/
│   ├── setup.js          # Configuración e inicialización de AdminJS
│   └── resources/        # Definición de recursos (modelos) en el panel
│       ├── admin.resource.js
│       ├── project.resource.js
│       └── section.resource.js
├── config/               # Configuraciones centralizadas (CORS, constantes)
├── controllers/          # Lógica de los manejadores HTTP
├── lib/
│   ├── prisma.js         # Instancia singleton del cliente Prisma
│   └── response.js       # Helpers de respuesta estandarizada
├── middlewares/          # Middlewares personalizados (error handling, auth)
├── routes/
│   ├── projects.js       # Endpoints de proyectos (/api/projects)
│   └── content.js        # Endpoints de secciones (/api/content)
├── services/             # Lógica de negocio (desacoplada de HTTP)
├── utils/                # Funciones utilitarias puras
├── validators/           # Validación y sanitización de datos de entrada
└── index.js              # Punto de entrada de la aplicación
```

---

## 🗄️ Modelos de Datos (Prisma Schema)

### `Admin`
Tabla exclusiva para autenticación del panel de administración.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Clave primaria autoincremental |
| `email` | String | Email único del administrador |
| `password_hash` | String | Hash de la contraseña |

### `Project`
Proyectos del portafolio mostrados en la página principal y vista de detalle.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Clave primaria autoincremental |
| `created_at` | DateTime | Fecha de creación |
| `title` | String | Nombre del proyecto |
| `slug` | String | Identificador único para URLs limpias |
| `short_description` | String | Descripción corta para tarjetas |
| `content` | String | Contenido detallado del proyecto |
| `cover_image` | String | URL de la imagen de portada |
| `technologies` | String[] | Lista de tecnologías usadas |
| `live_url` | String? | URL al sitio en producción (opcional) |

### `Section`
Textos y contenidos estáticos editables de las secciones del sitio (Hero, Sobre Mí, etc.).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Int | Clave primaria autoincremental |
| `slug` | String | Identificador único, ej: `hero-inicio` |
| `title` | String | Título de la sección |
| `body` | String | Párrafos o contenido HTML de la sección |

---

## 🛣️ Endpoints de la API

Todas las respuestas siguen el contrato estandarizado definido en [`/docs/API_CONTRACT.md`](../docs/API_CONTRACT.md):

```json
// Respuesta exitosa
{ "success": true, "data": { ... } }

// Respuesta de error
{ "success": false, "error": "CÓDIGO", "message": "Descripción" }
```

### Proyectos

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/projects` | Lista todos los proyectos. Admite `?featured=true` |
| `GET` | `/api/projects/:slug` | Retorna el detalle de un proyecto por slug |

### Contenido / Secciones

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/content/:slug` | Retorna los textos de una sección (ej. `/api/content/sobre-mi`) |

---

## 🔄 Flujo de una Petición

```
Cliente HTTP
    │
    ▼
[ Route ]  →  [ Middleware ]  →  [ Validator ]  →  [ Controller ]  →  [ Service ]  →  [ Prisma / MariaDB ]
                                                         │
                                               [ Response Helper ]
                                                         │
                                                    Respuesta JSON
```

Cada capa tiene una responsabilidad única y puede ser testeada de forma independiente:
- **Routes:** Solo registran endpoints y asignan controladores.
- **Controllers:** Manejan el contexto HTTP (`req`, `res`) y delegan a los servicios.
- **Services:** Contienen la lógica de negocio pura; no conocen Express.
- **Validators:** Validan y sanitizan los datos antes de llegar al controlador.

---

## 🖥️ Panel de Administración (AdminJS)

El panel permite gestionar el contenido del portafolio sin necesidad de modificar código.

- **Acceso local:** `http://localhost:5001/admin`
- **Acceso en producción:** `https://admin.claudiosalazar.cl/`

Los recursos disponibles en el panel se configuran en `src/admin/resources/`. Cada archivo define los campos visibles, editables y las acciones permitidas para un modelo de Prisma.

> Para agregar o modificar recursos en el panel, consulta el skill en `/backend/.agents/skills/adminjs-resource`.

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz de `backend/` con las siguientes variables:

```env
# Base de datos (NameHero - MariaDB)
DATABASE_URL="mysql://usuario:contraseña@host:puerto/nombre_db"

# Servidor
PORT=5001

# AdminJS
ADMIN_EMAIL="admin@claudiosalazar.cl"
ADMIN_PASSWORD="contraseña_segura"
SESSION_SECRET="clave_secreta_larga"

# CORS - Origen permitido del frontend
FRONTEND_URL="http://localhost:3000"
```

> **Las credenciales de la base de datos NUNCA deben exponerse en el código fuente.** El archivo `.env` está en `.gitignore`.

---

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo con hot-reload
npm run dev

# Iniciar en modo producción
npm start

# Sincronizar el schema de Prisma con la base de datos
npm run prisma:push

# Regenerar el cliente de Prisma (tras cambios en schema.prisma)
npm run prisma:generate

# Abrir Prisma Studio (explorador visual de la DB)
npm run prisma:studio
```

---

## 📋 Reglas y Convenciones

| Regla | Descripción |
|---|---|
| **Contrato API** | Toda respuesta debe usar `{ success, data }` o `{ success, error, message }` |
| **Seguridad** | Credenciales solo en `.env`; nunca en el código |
| **Sin renderizado HTML** | El backend solo sirve JSON (excepto el panel AdminJS) |
| **Sincronización** | Cambios en `schema.prisma` deben reflejarse en `API_CONTRACT.md` |
| **Sin acceso directo** | El frontend nunca se conecta a MariaDB; siempre a través de esta API |

---

**Autor:** Claudio Salazar — 2026
