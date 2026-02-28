import AdminJS, { ComponentLoader } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import session from "express-session";
import FileStore from "session-file-store";
import { fileURLToPath } from "url";
import path from "path";
import { AdminResourceOptions } from "./resources/admin.resource.js";
import { getProjectResourceConfig } from "./resources/project.resource.js";
import { getSectionResourceOptions } from "./resources/section.resource.js";
import { getMenuItemResourceOptions } from "./resources/menuitem.resource.js";
import { FooterBlockResourceOptions } from "./resources/footerblock.resource.js";

// Registrar el adaptador de Prisma en AdminJS
AdminJS.registerAdapter({ Database, Resource });

// ─── Registro de componentes React personalizados ────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentLoader = new ComponentLoader();

const Components = {
  MenuReorder: componentLoader.add(
    "MenuReorder",
    path.resolve(__dirname, "./components/MenuReorder")
  ),
};

// Inyecta "Inicio" como primer ítem de "Panel de Control" en el sidebar.
// SidebarResourceSection es el componente interno de AdminJS v7 que renderiza
// la sección de recursos del sidebar.
componentLoader.override(
  "SidebarResourceSection",
  path.resolve(__dirname, "./components/SidebarNavigation")
);

/**
 * Configura e inicializa AdminJS con autenticación por sesión.
 * Recibe la instancia compartida de PrismaClient.
 * @param {import('@prisma/client').PrismaClient} prisma
 */
export async function setupAdmin(prisma) {
  const models = Prisma.dmmf.datamodel.models;

  const adminJs = new AdminJS({
    componentLoader,
    resources: [
      {
        resource: { model: models.find(m => m.name === "Admin"), client: prisma },
        options: AdminResourceOptions,
      },
      (() => {
        const { options, features } = getProjectResourceConfig(componentLoader);
        return {
          resource: { model: models.find(m => m.name === "Project"), client: prisma },
          options,
          features,
        };
      })(),
      {
        resource: { model: models.find(m => m.name === "Section"), client: prisma },
        options: getSectionResourceOptions(prisma),
      },
      {
        resource: { model: models.find(m => m.name === "MenuItem"), client: prisma },
        options: getMenuItemResourceOptions(Components),
      },
      {
        resource: { model: models.find(m => m.name === "FooterBlock"), client: prisma },
        options: FooterBlockResourceOptions,
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
            // Nombres de recursos en el menú lateral
            Project:     "Proyectos",
            Section:     "Secciones",
            MenuItem:    "Menú",
            FooterBlock: "Footer",
            Admin:       "Administradores",
          },
          properties: {
            id: "ID",
            email: "Correo electrónico",
            password_hash: "Contraseña",
            title: "Título",
            slug: "Slug (URL)",
            project_type: "Tipo de proyecto",
            short_description: "Descripción corta",
            content: "Contenido",
            technologies: "Tecnologías",
            live_url: "Link proyecto",
            created_at: "Fecha de creación",
            image_1: "Imagen 1",
            image_2: "Imagen 2",
            image_3: "Imagen 3",
            image_4: "Imagen 4",
            image_5: "Imagen 5",
            image_1_file: "Imagen 1 (principal) *",
            image_2_file: "Imagen 2",
            image_3_file: "Imagen 3",
            image_4_file: "Imagen 4",
            image_5_file: "Imagen 5",
            body: "Cuerpo",
            image_url: "URL de imagen",
          },
          resources: {
            Project: { name: "Proyectos" },
            Section: { name: "Secciones" },
            MenuItem: { name: "Menu nav" },
            FooterBlock: { name: "Footer" },
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

  // Store persistente en disco: las sesiones sobreviven reinicios del servidor.
  const SessionFileStore = FileStore(session);
  const sessionStore = new SessionFileStore({
    path: "./sessions",
    ttl: 86400,       // 24 horas en segundos
    retries: 1,
    logFn: () => {},  // silencia los logs internos del store
  });

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
      store: sessionStore,
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
