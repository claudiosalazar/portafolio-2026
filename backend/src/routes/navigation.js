import { Router } from "express";
import prisma from "../lib/prisma.js";
import { sendSuccess, sendError } from "../lib/response.js";

const router = Router();

// ─── GET /api/navigation/menu ────────────────────────────────────────────────
// Endpoint público: solo ítems activos con campos mínimos para el frontend.
router.get("/menu", async (_req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { is_active: true },
      orderBy: { order: "asc" },
      select: { id: true, label: true, url: true, image_url: true, order: true },
    });
    sendSuccess(res, items);
  } catch (error) {
    sendError(res, "INTERNAL_ERROR", error.message);
  }
});

// ─── GET /api/navigation/menu/all ────────────────────────────────────────────
// Uso interno del panel admin: todos los ítems (activos e inactivos).
router.get("/menu/all", async (_req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { order: "asc" },
    });
    sendSuccess(res, items);
  } catch (error) {
    sendError(res, "INTERNAL_ERROR", error.message);
  }
});

// ─── PATCH /api/navigation/menu/reorder ──────────────────────────────────────
// Recibe [{id, order}] y actualiza el campo 'order' en una transacción atómica.
router.patch("/menu/reorder", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return sendError(res, "INVALID_INPUT", "Se esperaba un array de items con {id, order}.", 400);
  }
  try {
    await prisma.$transaction(
      items.map(({ id, order }) =>
        prisma.menuItem.update({ where: { id: Number(id) }, data: { order: Number(order) } })
      )
    );
    sendSuccess(res, { updated: items.length });
  } catch (error) {
    sendError(res, "INTERNAL_ERROR", error.message);
  }
});

// ─── GET /api/navigation/footer ─────────────────────────────────────────────
// Retorna todos los bloques activos del footer, agrupados por 'group'.
router.get("/footer", async (_req, res) => {
  try {
    const blocks = await prisma.footerBlock.findMany({
      where: { is_active: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
      select: { id: true, group: true, label: true, url: true, icon: true, order: true },
    });
    const grouped = blocks.reduce((acc, block) => {
      if (!acc[block.group]) acc[block.group] = [];
      acc[block.group].push(block);
      return acc;
    }, {});
    sendSuccess(res, grouped);
  } catch (error) {
    sendError(res, "INTERNAL_ERROR", error.message);
  }
});

export default router;
