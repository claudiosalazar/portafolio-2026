# ✅ Validators - Validación de Datos

Schemas y funciones para validar datos de entrada de forma declarativa.

## Librería Sugerida:
- **Zod** (recomendado)
- **Joi**
- **express-validator**

## Ejemplo con Zod:
```javascript
// project.validator.js
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  short_description: z.string().max(200),
  technologies: z.array(z.string()),
  live_url: z.string().url().optional()
});

export const validateProject = (req, res, next) => {
  try {
    createProjectSchema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      error: 'Validation error',
      details: err.errors 
    });
  }
};
```

## Uso:
```javascript
import { validateProject } from './validators/project.validator.js';
router.post('/projects', validateProject, createProject);
```
