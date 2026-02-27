# 📋 Config - Configuraciones Centralizadas

Esta carpeta contiene todas las configuraciones del backend:

## Archivos:
- `database.js` - Configuración de conexión a MariaDB (si se necesita más allá de Prisma)
- `constants.js` - Constantes globales de la aplicación
- `cors.js` - Configuración de CORS
- `session.js` - Configuración de sesiones (AdminJS)

## Uso:
```javascript
import { API_VERSION, BASE_URL } from './config/constants.js';
```
