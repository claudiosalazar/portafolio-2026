import type { Project } from "@/types/api";
import { apiFetch } from "./client";

/**
 * Retorna todos los proyectos ordenados por fecha de creación (más reciente primero).
 *
 * Uso en Server Component (Next.js):
 * ```tsx
 * const projects = await getProjects();
 * ```
 *
 * Uso con revalidación personalizada:
 * ```tsx
 * const projects = await getProjects({ next: { revalidate: 3600 } });
 * ```
 */
export async function getProjects(
  options?: RequestInit
): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects", options);
}

/**
 * Retorna un proyecto por su slug.
 * Lanza `ApiClientError` con code `"PROJECT_NOT_FOUND"` si no existe.
 *
 * @param slug - El slug del proyecto (ej: "generador-imagenes-ia")
 */
export async function getProjectBySlug(
  slug: string,
  options?: RequestInit
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${encodeURIComponent(slug)}`, options);
}
