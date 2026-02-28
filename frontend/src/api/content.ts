import type { Section } from "@/types/api";
import { apiFetch } from "./client";

/**
 * Retorna el contenido de una sección por su slug.
 * Lanza `ApiClientError` con code `"SECTION_NOT_FOUND"` si no existe.
 *
 * Slugs disponibles en la DB (ejemplos):
 *  - "hero-inicio"
 *  - "sobre-mi"
 *  - etc.
 *
 * @param slug - El slug de la sección (ej: "sobre-mi")
 */
export async function getSection(
  slug: string,
  options?: RequestInit
): Promise<Section> {
  return apiFetch<Section>(`/api/content/${encodeURIComponent(slug)}`, options);
}
