# 🔧 Services - Capa de Servicios de Negocio

Los servicios contienen la lógica de negocio pura, independiente de HTTP.

## Estructura:
- `project.service.js` - Operaciones de proyectos (CRUD)
- `content.service.js` - Operaciones de contenido

## Patrón:
```javascript
// project.service.js
export class ProjectService {
  static async getAll(filters = {}) {
    const { featured } = filters;
    return await prisma.project.findMany({
      where: featured ? { featured: true } : {},
      orderBy: { created_at: 'desc' }
    });
  }

  static async getBySlug(slug) {
    return await prisma.project.findUnique({
      where: { slug }
    });
  }
}
```

## Responsabilidades:
- Interactuar con Prisma/Base de datos
- Lógica de negocio compleja
- Transformación de datos
- Reutilizable desde controladores
