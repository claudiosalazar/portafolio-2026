import type { FooterData, MenuItem } from "@/types/api";
import { apiFetch } from "./client";

/**
 * Retorna todos los ítems activos del menú de navegación, ordenados por `order`.
 * Uso público — solo devuelve ítems con `is_active: true`.
 *
 * Campos expuestos: id, label, url, image_url, order.
 * (`source_slug` nunca se expone en este endpoint — solo uso interno del panel.)
 */
export async function getMenuItems(
  options?: RequestInit
): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>("/api/navigation/menu", options);
}

/**
 * Retorna los bloques activos del footer, agrupados por categoría.
 *
 * La clave de cada grupo es el valor del campo `group` en la DB:
 * "social" | "enlaces" | "contacto" | "legal" (u otros definidos por el admin)
 *
 * @example
 * const footer = await getFooter();
 * footer.social.forEach(item => ...)
 */
export async function getFooter(
  options?: RequestInit
): Promise<FooterData> {
  return apiFetch<FooterData>("/api/navigation/footer", options);
}
