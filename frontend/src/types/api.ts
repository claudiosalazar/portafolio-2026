// ─── Estructura base de respuesta de la API ──────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

// ─── Modelos de datos (espejo del API_CONTRACT.md) ────────────────────────────

export interface Project {
  id: number;
  created_at: string;         // ISO 8601
  title: string;
  slug: string;
  project_type: "development" | "design";
  short_description: string;
  content: string;            // HTML
  images: string[];           // URLs absolutas construidas por la API
  technologies: string[];
  live_url: string | null;
}

export interface Section {
  id: number;
  slug: string;
  title: string;
  body: string;               // HTML
  image_url: string | null;
}

export interface MenuItem {
  id: number;
  label: string;
  url: string;
  image_url: string | null;
  order: number;
}

export interface FooterItem {
  id: number;
  group: string;
  label: string;
  url: string | null;
  icon: string | null;
  order: number;
}

export type FooterData = Record<string, FooterItem[]>;
