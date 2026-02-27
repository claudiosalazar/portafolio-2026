# 🏗️ Arquitectura del Backend - Estructura de Carpetas

## 📁 Estructura Actual

```
backend/src/
├── admin/              # Panel AdminJS
│   ├── setup.js
│   └── resources/      # Configuración de recursos AdminJS
├── config/             # ⚙️ Configuraciones centralizadas
├── controllers/        # 🎮 Lógica de controladores HTTP
├── lib/                # 📚 Clientes de librerías externas
│   ├── prisma.js       # Cliente de Prisma
│   └── response.js     # Helpers de respuesta
├── middlewares/        # 🛡️ Middlewares personalizados
├── routes/             # 🛣️ Definición de rutas API
│   ├── projects.js
│   └── content.js
├── services/           # 🔧 Lógica de negocio
├── utils/              # 🛠️ Funciones utilitarias
├── validators/         # ✅ Validación de datos
└── index.js            # 🚀 Punto de entrada
```

## 🔄 Flujo de una Petición

```
1. Cliente → 2. Route → 3. Middleware → 4. Validator → 5. Controller → 6. Service → 7. Prisma/DB
                                                                ↓
                                                            Response ← ← ← ← ← ←
```

### Ejemplo Completo:
```javascript
// 1. Route: routes/projects.js
import { getAllProjects } from '../controllers/project.controller.js';
router.get('/', getAllProjects);

// 2. Controller: controllers/project.controller.js
export const getAllProjects = async (req, res) => {
  const projects = await ProjectService.getAll(req.query);
  res.json(successResponse(projects));
};

// 3. Service: services/project.service.js
export class ProjectService {
  static async getAll(filters) {
    return await prisma.project.findMany({ where: filters });
  }
}
```

## 📦 Responsabilidades por Carpeta

| Carpeta | Responsabilidad | Ejemplo de Contenido |
|---------|----------------|---------------------|
| **admin/** | Panel AdminJS | `setup.js`, `resources/` |
| **config/** | Configuraciones | `constants.js`, `cors.js` |
| **controllers/** | Lógica HTTP | `project.controller.js` |
| **lib/** | Clientes externos | `prisma.js` |
| **middlewares/** | Funciones intermedias | `errorHandler.js` |
| **routes/** | Definición de endpoints | `projects.js` |
| **services/** | Lógica de negocio | `ProjectService` |
| **utils/** | Funciones auxiliares | `slugify.js`, `pagination.js` |
| **validators/** | Validación de datos | `project.validator.js` |

## 🎯 Principios de Arquitectura

### 1. Separación de Responsabilidades (SoC)
- **Routes:** Solo definen endpoints y asignan controladores
- **Controllers:** Manejan HTTP, validan y llaman servicios
- **Services:** Contienen lógica de negocio pura
- **Validators:** Validan estructura de datos

### 2. Capas Desacopladas
Cada capa puede ser testeada independientemente:
- Services no conocen HTTP
- Controllers no conocen la DB directamente
- Routes no contienen lógica de negocio

### 3. Reutilización
- Services pueden ser usados desde múltiples controllers
- Utils pueden ser usados desde cualquier capa
- Validators son declarativos y reutilizables

## 🚀 Próximos Pasos

1. **Migrar lógica de routes/** → **controllers/**
2. **Crear services/** para cada recurso (Project, Content)
3. **Implementar middlewares/** (errorHandler, notFound)
4. **Agregar validators/** con Zod
5. **Centralizar config/** (cors, session, constants)

## 📚 Referencias

- [API_CONTRACT.md](/docs/API_CONTRACT.md) - Contrato de la API
- [AGENTS.md](/AGENTS.md) - Guía para agentes IA
