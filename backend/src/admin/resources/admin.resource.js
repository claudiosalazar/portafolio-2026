/** @type {import('adminjs').ResourceOptions} */
export const AdminResourceOptions = {
  navigation: { name: "Administración", icon: "Shield" },
  listProperties: ["id", "email"],
  filterProperties: ["email"],
  properties: {
    password_hash: {
      isVisible: { list: false, show: false, edit: true, filter: false },
    },
  },
};
