import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma.js";
import projectsRouter from "./routes/projects.js";
import contentRouter from "./routes/content.js";
import { setupAdmin } from "./admin/setup.js";

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Rutas API REST ──────────────────────────────────────────────────────────
app.use("/api/projects", projectsRouter);
app.use("/api/content", contentRouter);

// ─── Ruta raíz de la API ─────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      message: "API del Portafolio de Claudio Salazar",
      version: "1.0.0",
      endpoints: [
        "GET /api/projects",
        "GET /api/projects/:slug",
        "GET /api/content/:slug",
        "GET /admin (Panel AdminJS)",
      ],
    },
  });
});

// ─── Iniciar servidor ────────────────────────────────────────────────────────
async function start() {
  // Intentar conectar a la DB, pero no bloquear si falla
  try {
    await prisma.$connect();
    console.log("✅ Conectado a MariaDB correctamente.");
  } catch (error) {
    console.warn("⚠️  No se pudo conectar a MariaDB. La API funcionará en modo limitado.");
    console.warn("   Detalle:", error.message);
  }

  // Configurar AdminJS (funciona incluso sin conexión a DB)
  try {
    const { adminRouter } = await setupAdmin(prisma);
    app.use("/admin", adminRouter);
    console.log("✅ AdminJS montado en /admin");
  } catch (error) {
    console.warn("⚠️  No se pudo inicializar AdminJS:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`📋 Admin panel en http://localhost:${PORT}/admin\n`);
  });
}

start();
