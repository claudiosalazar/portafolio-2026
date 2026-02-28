/**
 * Script de sincronización: pobla MenuItem desde todas las Sections existentes.
 *
 * - Solo crea ítems que aún no existen (usa upsert por source_slug).
 * - No modifica ítems ya vinculados (solo actualiza label/url si ya existen).
 * - Los ítems creados manualmente (sin source_slug) no se tocan.
 *
 * Uso:
 *   node scripts/sync-menu.js
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.section.findMany({
    orderBy: { id: "asc" },
    select: { slug: true, title: true },
  });

  if (!sections.length) {
    console.log("ℹ️ No hay secciones en la base de datos todavía.");
    return;
  }

  console.log(`\n🔄 Sincronizando ${sections.length} sección(es) → MenuItem...\n`);

  for (let i = 0; i < sections.length; i++) {
    const { slug, title } = sections[i];

    const url = slug.startsWith("/") ? slug : `/${slug}`;
    const existing = await prisma.menuItem.findUnique({ where: { source_slug: slug } });
    const result = await prisma.menuItem.upsert({
      where: { source_slug: slug },
      update: { label: title, url },
      create: { label: title, url, source_slug: slug, order: i },
    });
    const action = existing ? "actualizado" : "creado";
    console.log(`  ✅ [${action}] "${result.label}" → ${result.url} (order: ${result.order})`);
  }

  const total = await prisma.menuItem.count();
  console.log(`\n📋 Total ítems en el menú: ${total}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
