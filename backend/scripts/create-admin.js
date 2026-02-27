/**
 * Script para crear el usuario administrador inicial en la base de datos.
 *
 * Uso:
 *   node scripts/create-admin.js --email=tu@email.com --password=tuContraseña
 *
 * Si no se pasan argumentos, usa los valores por defecto de abajo.
 */

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Parsear argumentos CLI ───────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace("--", "").split("=");
    return [key, value];
  })
);

const email = args.email ?? "contacto@claudiosalazar.cl";
const password = args.password;

if (!password) {
  console.error("❌ Debes proporcionar una contraseña:");
  console.error("   node scripts/create-admin.js --email=tu@email.com --password=tuContraseña");
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌ La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

// ─── Crear o actualizar el admin ──────────────────────────────────────────────
async function main() {
  console.log(`\n🔧 Configurando admin para: ${email}`);

  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password_hash },
    create: { email, password_hash },
  });

  console.log(`✅ Admin listo: ID=${admin.id} | Email=${admin.email}`);
  console.log(`\n🔐 Ya puedes ingresar al panel en: http://localhost:5001/admin\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
