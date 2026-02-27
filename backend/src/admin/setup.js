import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { AdminResourceOptions } from "./resources/admin.resource.js";
import { ProjectResourceOptions } from "./resources/project.resource.js";
import { SectionResourceOptions } from "./resources/section.resource.js";

// Registrar el adaptador de Prisma en AdminJS
AdminJS.registerAdapter({ Database, Resource });

/**
 * Configura e inicializa AdminJS con autenticación por sesión.
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
      companyName: "Claudio Salazar",
      softwareBrothers: false,
      logo: false,
      favicon: "/favicon.ico",
    },
    locale: {
      language: "es",
      availableLanguages: ["es"],
      translations: {
        es: {
          actions: {
            new: "Crear nuevo",
            edit: "Editar",
            show: "Ver detalle",
            delete: "Eliminar",
            list: "Listar",
            search: "Buscar",
          },
          buttons: {
            save: "Guardar",
            addNewItem: "Agregar elemento",
            filter: "Filtrar",
            applyChanges: "Aplicar cambios",
            resetFilter: "Limpiar",
            confirmRemovalMany_1: "Confirmar eliminación de {{count}} registro",
            confirmRemovalMany_other: "Confirmar eliminación de {{count}} registros",
            logout: "Cerrar sesión",
            login: "Ingresar",
          },
          labels: {
            navigation: "Panel de Control",
            pages: "Páginas",
            selectedRecords: "Seleccionados ({{count}})",
            filters: "Filtros",
            adminVersion: "Admin v{{version}}",
            appVersion: "App",
          },
          properties: {
            id: "ID",
            email: "Correo electrónico",
            password_hash: "Contraseña",
            title: "Título",
            slug: "Slug (URL)",
            short_description: "Descripción corta",
            content: "Contenido",
            cover_image: "Imagen de portada",
            technologies: "Tecnologías",
            live_url: "URL en vivo",
            created_at: "Fecha de creación",
            body: "Cuerpo",
            image_url: "URL de imagen",
          },
          messages: {
            successfullyUpdated: "{{resourceId}} actualizado correctamente.",
            successfullyDeleted: "{{resourceId}} eliminado correctamente.",
            successfullyBulkDeleted: "{{count}} {{resourceId}} eliminados.",
            thereWereValidationErrors: "Hay errores de validación. Por favor revísalos.",
            forbiddenError:
              "No tienes permisos para realizar la acción {{actionName}} en {{resourceId}}.",
            anyForbiddenError: "No tienes permisos para realizar esta acción.",
            loginWelcome: "Ingresa al panel de administración",
            noRecords: "No hay registros disponibles.",
            noResults: "Sin resultados para tu búsqueda.",
          },
        },
      },
    },
  });

  /**
   * Función de autenticación: verifica email y contraseña contra la DB.
   * Devuelve el objeto admin si las credenciales son válidas, o null si no.
   */
  const authenticate = async (email, password) => {
    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) return null;

      const isValid = await bcrypt.compare(password, admin.password_hash);
      return isValid ? { email: admin.email, id: admin.id } : null;
    } catch {
      return null;
    }
  };

  const cookiePassword = process.env.COOKIE_PASSWORD;
  if (!cookiePassword || cookiePassword.length < 32) {
    throw new Error("COOKIE_PASSWORD debe tener al menos 32 caracteres en el archivo .env");
  }

  // Router con autenticación por sesión
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate,
      cookieName: "adminjs_session",
      cookiePassword,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: cookiePassword,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      },
    }
  );

  return { adminJs, adminRouter };
}
