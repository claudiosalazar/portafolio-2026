import { Router } from "express";
import prisma from "../lib/prisma.js";
import { sendSuccess, sendError } from "../lib/response.js";

const router = Router();

// ─── GET /api/content/:slug ──────────────────────────────────────────────────
// Retorna los textos de una sección específica
router.get("/:slug", async (req, res) => {
  try {
    const section = await prisma.section.findUnique({
      where: { slug: req.params.slug },
    });

    if (!section) {
      return sendError(res, "SECTION_NOT_FOUND", "La sección no fue encontrada.", 404);
    }

    return sendSuccess(res, section);
  } catch (error) {
    console.error("Error al obtener sección:", error);
    return sendError(res, "SECTION_FETCH_ERROR", "No se pudo obtener la sección.");
  }
});

export default router;
