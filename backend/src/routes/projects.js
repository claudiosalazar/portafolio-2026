import { Router } from "express";
import prisma from "../lib/prisma.js";
import { sendSuccess, sendError } from "../lib/response.js";

const router = Router();

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5001";

/**
 * Transforma un registro de la DB al formato de respuesta esperado por el frontend.
 * - Convierte image_1…image_5 en un array `images` con URLs completas.
 * - Convierte `technologies` de string separado por comas a array.
 */
function transformProject(project) {
  const {
    image_1, image_2, image_3, image_4, image_5,
    technologies,
    project_type,
    ...rest
  } = project;

  const images = [image_1, image_2, image_3, image_4, image_5]
    .filter(Boolean)
    .map((filename) => `${BASE_URL}/images/${filename}`);

  const techArray = technologies
    ? technologies.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    ...rest,
    project_type,
    technologies: techArray,
    images,
  };
}

// ─── GET /api/projects ───────────────────────────────────────────────────────
// Retorna todos los proyectos. Soporta ?featured=true
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_at: "desc" },
    });

    return sendSuccess(res, projects.map(transformProject));
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return sendError(res, "PROJECTS_FETCH_ERROR", "No se pudieron obtener los proyectos.");
  }
});

// ─── GET /api/projects/:slug ─────────────────────────────────────────────────
// Retorna un proyecto por su slug
router.get("/:slug", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: req.params.slug },
    });

    if (!project) {
      return sendError(res, "PROJECT_NOT_FOUND", "El proyecto no fue encontrado.", 404);
    }

    return sendSuccess(res, transformProject(project));
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return sendError(res, "PROJECT_FETCH_ERROR", "No se pudo obtener el proyecto.");
  }
});

export default router;
