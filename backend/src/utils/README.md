# 🛠️ Utils - Funciones Utilitarias

Funciones auxiliares reutilizables en toda la aplicación.

## Archivos Sugeridos:
- `response.js` - Helpers para formatear respuestas (mover desde /lib)
- `slugify.js` - Generar slugs a partir de títulos
- `dateFormatter.js` - Formateo de fechas
- `fileUpload.js` - Manejo de archivos subidos
- `pagination.js` - Helpers para paginación

## Ejemplo:
```javascript
// response.js
export const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data
});

export const errorResponse = (error, status = 500) => ({
  success: false,
  error: error.message || error,
  status
});
```

## Diferencia con /lib:
- **lib/** → Configuraciones de librerías externas (Prisma client)
- **utils/** → Funciones utilitarias propias del proyecto
