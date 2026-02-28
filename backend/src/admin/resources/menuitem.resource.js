/**
 * Factory que genera las opciones del recurso MenuItem.
 *
 * @param {{ MenuReorder: string }} components - IDs de componentes registrados en AdminJS
 * @returns {import('adminjs').ResourceOptions}
 */
export const getMenuItemResourceOptions = (components) => ({
  navigation: { name: "Navegación", icon: "Navigation" },
  listProperties: ["id", "label", "url", "order", "is_active", "source_slug"],
  showProperties: ["id", "label", "url", "image_url", "order", "is_active", "source_slug"],
  editProperties: ["label", "url", "image_url", "order", "is_active"],
  filterProperties: ["label", "url", "is_active"],
  properties: {
    label: {
      label: "Etiqueta",
      description: "Texto visible en el menú (ej: Inicio, Proyectos, Contacto).",
    },
    url: {
      label: "URL",
      description: "Ruta de destino. Usa rutas relativas para internas (ej: /proyectos) o absolutas para externas.",
    },
    image_url: {
      label: "Imagen / Logo",
      description: "URL pública de una imagen o logo para mostrar junto al ítem (opcional).",
    },
    order: {
      label: "Orden",
      description: "Número de posición en el menú. Menor número = primero. Usa el botón 'Reordenar' para reorganizar visualmente.",
    },
    is_active: {
      label: "Activo",
      description: "Desactiva este ítem para ocultarlo del menú sin eliminarlo.",
    },
    source_slug: {
      label: "Origen (Sección)",
      description: "Indica que este ítem fue creado automáticamente desde una Sección. Su label y URL se sincronizan solos.",
      isVisible: { list: true, show: true, edit: false, filter: false },
    },
  },
  actions: {
    // ── Acción personalizada: página de reordenamiento con drag & drop ────────
    reorderMenu: {
      actionType: "resource",
      label: "⠿ Reordenar",
      icon: "Sort",
      component: components.MenuReorder,
      handler: async (request, response, context) => {
        return { records: context.records ?? [] };
      },
    },
  },
});
