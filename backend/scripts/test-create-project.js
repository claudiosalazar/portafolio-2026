/**
 * Script de prueba para verificar que la creación de proyectos funciona.
 *
 * Prueba directamente las dos capas críticas sin necesidad de autenticación:
 *   1. Prisma  → crea un registro real en la DB (verifica el schema)
 *   2. Disco   → verifica que los directorios de upload existen y son escribibles
 *   3. Limpieza → elimina el registro de prueba de la DB
 *
 * Uso:
 *   cd backend && node scripts/test-create-project.js
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma    = new PrismaClient();
const SLUG      = `test-proyecto-prueba-${Date.now()}`;
const UPLOAD_DIR = path.resolve(__dirname, "../upload");

// PNG 1×1 px válido (base64 verificado)
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
  "base64"
);

const ok   = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => { console.error(`  ❌ ${msg}`); process.exit(1); };

// ─── 1. Verificar directorios de upload ──────────────────────────────────────
function testUploadDirs() {
  console.log("\n📋 PASO 1: Verificar directorios de upload");

  for (const dir of ["development", "design"]) {
    const fullPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      ok(`Directorio creado: ${fullPath}`);
    } else {
      ok(`Directorio existe: ${fullPath}`);
    }

    // Verificar que se puede escribir un archivo
    const testFile = path.join(fullPath, `__write-test-${Date.now()}.png`);
    fs.writeFileSync(testFile, TINY_PNG);
    fs.unlinkSync(testFile);
    ok(`Escritura/borrado OK en: ${dir}/`);
  }
}

// ─── 2. Prisma: crear proyecto de prueba ─────────────────────────────────────
async function testPrismaCreate() {
  console.log("\n📋 PASO 2: Crear proyecto en la DB (Prisma)");

  const project = await prisma.project.create({
    data: {
      title:             "TEST — Proyecto de prueba (seguro de eliminar)",
      slug:              SLUG,
      project_type:      "development",
      short_description: "Proyecto creado automáticamente por el script de test.",
      content:           "<p>Contenido de prueba.</p>",
      technologies:      "Node.js, AdminJS",
      live_url:          null,
      image_1:           `development/test-image-${Date.now()}.png`,
    },
  });

  ok(`Registro creado en DB. ID: ${project.id} | slug: "${project.slug}"`);
  ok(`image_1 guardado: "${project.image_1}"`);
  return project.id;
}

// ─── 3. Prisma: leer el proyecto recién creado ────────────────────────────────
async function testPrismaRead(id) {
  console.log("\n📋 PASO 3: Leer el proyecto desde la DB");

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) fail(`No se encontró el proyecto con ID ${id} en la DB.`);

  ok(`Lectura OK. Campos verificados:`);
  console.log(`       title:        "${project.title}"`);
  console.log(`       project_type: "${project.project_type}"`);
  console.log(`       image_1:      "${project.image_1}"`);
  console.log(`       technologies: "${project.technologies}"`);
}

// ─── 4. Verificar que la API pública responde ─────────────────────────────────
async function testApiEndpoint() {
  console.log("\n📋 PASO 4: Verificar endpoint público GET /api/projects");

  const res = await fetch("http://localhost:5001/api/projects");
  if (!res.ok) fail(`El endpoint devolvió status ${res.status}`);

  const body = await res.json();
  if (!body.success) fail(`Respuesta inesperada: ${JSON.stringify(body)}`);

  ok(`GET /api/projects responde correctamente (${body.data.length} proyectos en DB)`);
}

// ─── 5. Limpieza ──────────────────────────────────────────────────────────────
async function cleanup(id) {
  console.log("\n📋 PASO 5: Limpieza");
  await prisma.project.delete({ where: { id } });
  ok(`Proyecto de prueba ID ${id} eliminado de la DB.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("🧪 TEST: Verificación del sistema de proyectos");
  console.log(`   Slug de prueba: ${SLUG}`);

  let id = null;
  try {
    testUploadDirs();
    id = await testPrismaCreate();
    await testPrismaRead(id);
    await testApiEndpoint();

    console.log("\n🎉 RESULTADO: Todo correcto. El sistema de proyectos funciona bien.\n");
  } catch (err) {
    console.error(`\n💥 Error: ${err.message}`);
    if (err.code) console.error(`   Code: ${err.code}`);
  } finally {
    if (id) await cleanup(id).catch(() => null);
    await prisma.$disconnect();
  }
})();

