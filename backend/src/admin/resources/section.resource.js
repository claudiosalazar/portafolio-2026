/**
 * Factory que genera las opciones del recurso Section.
 * Recibe prisma para poder sincronizar automáticamente los MenuItems.
 *
 * Comportamiento de sincronización:
 *  - Al crear una Section → se crea un MenuItem vinculado (source_slug = slug).
 *  - Al editar una Section → se actualiza label/url del MenuItem vinculado.
 *  - Al eliminar una Section → se elimina el MenuItem vinculado.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {import('adminjs').ResourceOptions}
 */
export const getSectionResourceOptions = (prisma) => {
  /**
   * Crea o actualiza el MenuItem vinculado a una Section.
   */
  const upsertMenuItem = async (slug, title) => {
    const count = await prisma.menuItem.count();
    const url = slug.startsWith("/") ? slug : `/${slug}`;
    await prisma.menuItem.upsert({
      where: { source_slug: slug },
      update: { label: title, url },
      create: { label: title, url, source_slug: slug, order: count },
    });
  };

  return {
    navigation: { name: null, icon: "File" },
    listProperties: ["id", "slug", "title"],
    filterProperties: ["slug", "title"],
    properties: {
      body: {
        type: "richtext",
      },
      slug: {
        description: "Identificador único de la sección (ej: hero-inicio, sobre-mi). Al crear, se agrega automáticamente al Menú.",
      },
      image_url: {
        description: "URL pública de la imagen de esta sección (opcional).",
      },
    },
    actions: {
      // ── Crear Section → crear MenuItem vinculado ──────────────────────────
      new: {
        after: [async (response) => {
          const { params, errors } = response.record ?? {};
          if (params && !Object.keys(errors ?? {}).length) {
            const { slug, title } = params;
            if (slug && title) await upsertMenuItem(slug, title);
          }
          return response;
        }],
      },

      // ── Editar Section → actualizar MenuItem vinculado ────────────────────
      edit: {
        before: [async (request, context) => {
          // Capturar el slug ORIGINAL antes de que se apliquen los cambios
          if (request.method !== "get") {
            context._sectionOldSlug = context.record?.params?.slug ?? null;
          }
          return request;
        }],
        after: [async (response, _request, context) => {
          const { params, errors } = response.record ?? {};
          if (params && !Object.keys(errors ?? {}).length) {
            const { slug, title } = params;
            const oldSlug = context._sectionOldSlug ?? slug;
            if (slug && title) {
              const existing = await prisma.menuItem.findUnique({ where: { source_slug: oldSlug } });
              if (existing) {
                // Actualizar (incluido si el slug cambió)
                const newUrl = slug.startsWith("/") ? slug : `/${slug}`;
                await prisma.menuItem.update({
                  where: { source_slug: oldSlug },
                  data: { label: title, url: newUrl, source_slug: slug },
                });
              } else {
                // No existía (fue creada antes de implementar esta feature) → crear ahora
                await upsertMenuItem(slug, title);
              }
            }
          }
          return response;
        }],
      },

      // ── Eliminar Section → eliminar MenuItem vinculado ────────────────────
      delete: {
        before: [async (request, context) => {
          const slug = context.record?.params?.slug;
          if (slug) {
            await prisma.menuItem.deleteMany({ where: { source_slug: slug } });
          }
          return request;
        }],
      },
    },
  };
};
