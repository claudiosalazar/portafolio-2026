# Portafolio Web — Claudio Salazar

Sitio web de portafolio profesional construido como un **monorepo desacoplado**, donde el backend actúa como cimiento permanente de datos y el frontend como una fachada reemplazable e independiente.

---

## 🏗️ Arquitectura General

El proyecto sigue una arquitectura de dos capas estrictamente separadas que se comunican exclusivamente a través de una API REST.

```
┌──────────────────────┐        API REST (JSON)        ┌──────────────────────┐
│      Frontend        │ ──────────────────────────►  │      Backend         │
│  Next.js - React 19  │                               │  Node.js - Express   │
│  SCSS Modules + GSAP │ ◄──────────────────────────  │  Prisma + MariaDB    │
└──────────────────────┘                               └──────────────────────┘
                                                               │
                                                        ┌──────┴──────┐
                                                        │   AdminJS   │
                                                        │  Panel CMS  │
                                                        └─────────────┘
```

## 📂 Estructura del Monorepo

```
portafolio-2026/
├── frontend/       # Aplicación Next.js (UI pública)
├── backend/        # API REST + Panel de Administración
└── docs/           # API_CONTRACT.md y documentación compartida
```

## 🌐 URLs del Proyecto

| Entorno      | Servicio      | URL                              |
|--------------|---------------|----------------------------------|
| Producción   | Sitio público | `https://claudiosalazar.cl/`     |
| Producción   | API REST      | `https://api.claudiosalazar.cl/` |
| Producción   | Panel Admin   | `https://admin.claudiosalazar.cl/` |
| Local        | Frontend      | `http://localhost:3000`          |
| Local        | Backend / API | `http://localhost:5001`          |
| Local        | Panel Admin   | `http://localhost:5001/admin`    |

## 🚀 Inicio Rápido

### 1. Backend

```bash
cd backend
npm install
# Configura las variables de entorno (ver backend/README.md)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

> Asegúrate de que el backend esté corriendo antes de iniciar el frontend.

## 🤝 Contrato API

Toda la comunicación entre subsistemas está definida y versionada en [`/docs/API_CONTRACT.md`](./docs/API_CONTRACT.md). **Ningún cambio de endpoints o modelos debe realizarse sin actualizar ese documento primero.**

## 📄 Documentación Detallada

- [Documentación del Frontend](./frontend/README.md)
- [Documentación del Backend](./backend/README.md)
- [Contrato API](./docs/API_CONTRACT.md)

---

**Autor:** Claudio Salazar — 2026
