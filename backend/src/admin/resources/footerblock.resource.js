/** @type {import('adminjs').ResourceOptions} */
export const FooterBlockResourceOptions = {
  navigation: { name: "Navegación", icon: "List" },
  listProperties: ["id", "group", "label", "url", "order", "is_active"],
  filterProperties: ["group", "label", "is_active"],
  properties: {
    group: {
      label: "Grupo",
      description: "Categoría del bloque dentro del footer. Valores sugeridos: 'social', 'enlaces', 'contacto', 'legal'.",
    },
    label: {
      label: "Etiqueta",
      description: "Texto visible del ítem (ej: GitHub, LinkedIn, Política de privacidad).",
    },
    url: {
      label: "URL",
      description: "Enlace de destino (opcional). Puede ser relativo o absoluto.",
    },
    icon: {
      label: "Icono",
      description: "Nombre del icono a mostrar (ej: github, linkedin, mail). Depende de la librería de iconos del frontend.",
    },
    order: {
      label: "Orden",
      description: "Posición dentro de su grupo. Menor número = primero.",
    },
    is_active: {
      label: "Activo",
      description: "Desactiva este ítem para ocultarlo del footer sin eliminarlo.",
    },
  },
};
