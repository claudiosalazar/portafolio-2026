import { Router } from "express";
import prisma from "../lib/prisma.js";
import { sendSuccess, sendError } from "../lib/response.js";

const router = Router();

// ─── GET /api/projects ───────────────────────────────────────────────────────
// Retorna todos los proyectos. Soporta ?featured=true
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_at: "desc" },
    });

    return sendSuccess(res, projects);
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

    return sendSuccess(res, project);
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return sendError(res, "PROJECT_FETCH_ERROR", "No se pudo obtener el proyecto.");
  }
});

export default router;
