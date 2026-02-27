import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import { Prisma } from "@prisma/client";
import { AdminResourceOptions } from "./resources/admin.resource.js";
import { ProjectResourceOptions } from "./resources/project.resource.js";
import { SectionResourceOptions } from "./resources/section.resource.js";

// Registrar el adaptador de Prisma en AdminJS
AdminJS.registerAdapter({ Database, Resource });

/**
 * Configura e inicializa AdminJS.
 * Recibe la instancia compartida de PrismaClient.
 * @param {import('@prisma/client').PrismaClient} prisma
 */
export async function setupAdmin(prisma) {
  const models = Prisma.dmmf.datamodel.models;

  const adminJs = new AdminJS({
    resources: [
      {
        resource: { model: models.find(m => m.name === "Admin"), client: prisma },
        options: AdminResourceOptions,
      },
      {
        resource: { model: models.find(m => m.name === "Project"), client: prisma },
        options: ProjectResourceOptions,
      },
      {
        resource: { model: models.find(m => m.name === "Section"), client: prisma },
        options: SectionResourceOptions,
      },
    ],
    rootPath: "/admin",
    branding: {
      companyName: "Claudio Salazar - Admin",
      softwareBrothers: false,
      logo: false,
    },
  });

  // Router de AdminJS (sin autenticación por ahora para desarrollo)
  const adminRouter = AdminJSExpress.buildRouter(adminJs);

  return { adminJs, adminRouter };
}
