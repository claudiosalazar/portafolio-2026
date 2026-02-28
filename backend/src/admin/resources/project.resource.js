import { fileURLToPath } from "url";
import path from "path";
import uploadFeature from "@adminjs/upload";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, "../../../upload");
const imageBaseUrl = process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL}/images`
  : "http://localhost:5001/images";

/**
 * Crea una feature de upload para un campo de imagen individual.
 * El archivo se guarda en /upload/{project_type}/{nombre-sanitizado}-{timestamp}.ext
 * @param {import('adminjs').ComponentLoader} componentLoader
 * @param {string} fieldName - nombre del campo en la DB (image_1 … image_5)
 */
function makeUploadFeature(componentLoader, fieldName) {
  return uploadFeature({
    componentLoader,
    provider: {
      local: {
        bucket: uploadDir,
        opts: { baseUrl: imageBaseUrl },
      },
    },
    properties: {
      key: fieldName,
      // Las 3 propiedades virtuales deben ser únicas por feature.
      // Si dos features comparten el mismo nombre en cualquiera de ellas → error 500.
      file:          `${fieldName}_file`,
      filePath:      `${fieldName}_filePath`,
      filesToDelete: `${fieldName}_filesToDelete`,
    },
    uploadPath: (record, filename) => {
      const type = record.params.project_type || "development";
      const ext = path.extname(filename).toLowerCase();
      const base = path
        .basename(filename, ext)
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()
        .slice(0, 60);
      return `${type}/${base}-${Date.now()}${ext}`;
    },
    validation: {
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  });
}

/**
 * Retorna las opciones y features del recurso Project para AdminJS.
 * @param {import('adminjs').ComponentLoader} componentLoader
 * @returns {{ options: object, features: Array }}
 */
export function getProjectResourceConfig(componentLoader) {
  const options = {
    navigation: { name: null, icon: "Briefcase" },
    listProperties: ["id", "title", "project_type", "slug", "created_at"],
    filterProperties: ["title", "project_type", "slug"],
    editProperties: [
      "title",
      "slug",
      "project_type",
      "short_description",
      "content",
      "technologies",
      "live_url",
      // Propiedades virtuales del upload feature (generan input file, no text)
      "image_1_file",
      "image_2_file",
      "image_3_file",
      "image_4_file",
      "image_5_file",
    ],
    showProperties: [
      "id",
      "title",
      "slug",
      "project_type",
      "short_description",
      "content",
      "technologies",
      "live_url",
      // En la vista de detalle mostramos la ruta guardada (texto) de cada imagen
      "image_1",
      "image_2",
      "image_3",
      "image_4",
      "image_5",
      "created_at",
    ],
    properties: {
      content: {
        type: "richtext",
      },
      short_description: {
        type: "textarea",
      },
      project_type: {
        availableValues: [
          { value: "development", label: "Development" },
          { value: "design", label: "Design" },
        ],
      },
      technologies: {
        type: "textarea",
        description:
          "Ingresa las tecnologías separadas por coma. Ej: Node.js, React, GSAP (opcional)",
      },
      slug: {
        description: "URL amigable (ej: mi-proyecto-genial). No uses espacios.",
      },
      image_1: {
        description: "Imagen principal del proyecto (obligatoria).",
        // El campo raw se oculta del formulario; se gestiona via image_1_file
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      image_2: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      image_3: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      image_4: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      image_5: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      // Propiedades virtuales internas del upload feature — ocultas en todas las vistas
      image_1_filePath:      { isVisible: false },
      image_2_filePath:      { isVisible: false },
      image_3_filePath:      { isVisible: false },
      image_4_filePath:      { isVisible: false },
      image_5_filePath:      { isVisible: false },
      image_1_filesToDelete: { isVisible: false },
      image_2_filesToDelete: { isVisible: false },
      image_3_filesToDelete: { isVisible: false },
      image_4_filesToDelete: { isVisible: false },
      image_5_filesToDelete: { isVisible: false },
      created_at: {
        isVisible: { edit: false, show: true, list: true, filter: true },
      },
    },
    actions: {
      new: {
        before: [
          async (request) => {
            if (request.method !== "post") return request;

            // technologies es opcional: garantizar string vacío si no se ingresó nada
            if (!request.payload?.technologies) {
              request.payload = { ...request.payload, technologies: "" };
            }

            return request;
          },
        ],
      },
      edit: {
        before: [
          async (request) => {
            if (request.method !== "post") return request;

            // technologies es opcional: garantizar string vacío si se borra el contenido
            if (request.payload && !request.payload.technologies) {
              request.payload = { ...request.payload, technologies: "" };
            }

            return request;
          },
        ],
      },
    },
  };

  const features = [
    makeUploadFeature(componentLoader, "image_1"),
    makeUploadFeature(componentLoader, "image_2"),
    makeUploadFeature(componentLoader, "image_3"),
    makeUploadFeature(componentLoader, "image_4"),
    makeUploadFeature(componentLoader, "image_5"),
  ];

  return { options, features };
}
