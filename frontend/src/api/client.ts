import type { ApiError, ApiResponse } from "@/types/api";

// URL base de la API. En producción apunta a api.claudiosalazar.cl
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

/**
 * Wrapper sobre `fetch` tipado para consumir la API REST del backend.
 *
 * - En Next.js Server Components usa cache de Next.js (configurable por llamada).
 * - Lanza un ApiClientError con el código y mensaje del backend si `success: false`.
 * - Lanza un ApiClientError genérico si la respuesta no es JSON válido o hay error de red.
 *
 * @example
 * const projects = await apiFetch<Project[]>("/api/projects");
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiClientError(
      "NETWORK_ERROR",
      `No se pudo conectar con la API. ¿Está corriendo el backend en ${API_BASE_URL}?`
    );
  }

  let json: ApiResponse<T> | ApiError;
  try {
    json = await res.json();
  } catch {
    throw new ApiClientError(
      "PARSE_ERROR",
      `La respuesta de ${url} no es JSON válido (status ${res.status}).`
    );
  }

  if (!json.success) {
    throw new ApiClientError(json.error, json.message);
  }

  return json.data;
}

// ─── Error tipado para manejo uniforme en el frontend ────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
