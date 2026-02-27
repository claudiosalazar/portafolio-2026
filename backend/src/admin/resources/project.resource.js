/** @type {import('adminjs').ResourceOptions} */
export const ProjectResourceOptions = {
  navigation: { name: "Gestión de Portafolio", icon: "Briefcase" },
  listProperties: ["id", "title", "slug", "created_at"],
  filterProperties: ["title", "slug", "technologies"],
  properties: {
    content: {
      type: "richtext",
    },
    short_description: {
      type: "textarea",
    },
    cover_image: {
      description: "Ingresa la URL pública de la imagen.",
    },
    slug: {
      description: "URL amigable (ej: mi-proyecto-genial). No uses espacios.",
    },
    created_at: {
      isVisible: { edit: false, show: true, list: true, filter: true },
    },
    technologies: {
      type: "mixed",
      isArray: true,
    },
  },
};
