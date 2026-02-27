# 🛡️ Middlewares - Funciones Intermedias

Middlewares personalizados que se ejecutan antes de los controladores.

## Archivos:
- `errorHandler.js` - Manejo centralizado de errores
- `validator.js` - Middleware de validación de datos
- `notFound.js` - Manejo de rutas 404
- `logger.js` - Logging de peticiones (opcional)

## Ejemplo:
```javascript
// errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message
  });
};
```

## Uso en Express:
```javascript
import { errorHandler } from './middlewares/errorHandler.js';
app.use(errorHandler);
```
