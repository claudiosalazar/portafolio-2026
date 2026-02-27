# 🎮 Controllers - Controladores de Lógica de Negocio

Los controladores manejan la lógica de negocio y coordinan entre servicios y rutas.

## Estructura:
- `projects.controller.js` - Lógica para gestión de proyectos
- `content.controller.js` - Lógica para secciones de contenido

## Patrón:
```javascript
export const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectService.getAll(req.query);
    return res.json({ success: true, data: projects });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
```

## Responsabilidades:
- Validar parámetros de entrada
- Llamar a servicios correspondientes
- Formatear respuestas según API_CONTRACT
- Manejar errores HTTP
