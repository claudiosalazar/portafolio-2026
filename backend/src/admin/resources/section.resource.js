/** @type {import('adminjs').ResourceOptions} */
export const SectionResourceOptions = {
  navigation: { name: "Contenido Estático", icon: "Document" },
  listProperties: ["id", "slug", "title"],
  filterProperties: ["slug", "title"],
  properties: {
    body: {
      type: "richtext",
    },
    slug: {
      description: "Identificador único de la sección (ej: hero-inicio, sobre-mi).",
    },
    image_url: {
      description: "URL pública de la imagen de esta sección (opcional).",
    },
  },
};
