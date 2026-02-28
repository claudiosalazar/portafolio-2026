import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hook reutilizable: hashea 'password_hash' si viene con valor en el payload.
 * Si no viene (campo vacío en edición), lo elimina del payload para no sobreescribir.
 */
async function hashPasswordHook(request) {
  if (request.method === "get") return request;

  const { password_hash } = request.payload ?? {};

  if (password_hash) {
    request.payload.password_hash = await bcrypt.hash(password_hash, SALT_ROUNDS);
  } else if (request.payload) {
    // En edición: si el campo viene vacío, no modificar la contraseña existente
    delete request.payload.password_hash;
  }

  return request;
}

/** @type {import('adminjs').ResourceOptions} */
export const AdminResourceOptions = {
  navigation: false,
  listProperties: ["id", "email"],
  filterProperties: ["email"],
  properties: {
    password_hash: {
      label: "Contraseña",
      type: "password",
      isVisible: { list: false, show: false, edit: true, filter: false },
    },
  },
  actions: {
    new: {
      before: [hashPasswordHook],
    },
    edit: {
      before: [hashPasswordHook],
    },
  },
};
