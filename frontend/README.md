# Frontend — Portafolio Web Claudio Salazar

Aplicación web pública del portafolio de Claudio Salazar, construida con **Next.js 16** y **React 19**. Actúa como consumidor headless de la API REST del backend: nunca accede directamente a la base de datos; todos los datos provienen de los endpoints definidos en el [API Contract](../docs/API_CONTRACT.md).

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 16.1.6 | Framework React con App Router y SSR/SSG |
| React | 19.2.3 | Biblioteca de UI |
| TypeScript | ^5 | Tipado estático |
| SASS / SCSS Modules | ^1.97 | Sistema de estilos encapsulados |
| GSAP + @gsap/react | ^3.14 / ^2.1 | Animaciones de alto rendimiento |

---

## 📂 Estructura de Carpetas

```
frontend/src/
├── api/                  # Funciones fetch hacia la API del backend
├── app/                  # App Router de Next.js
│   ├── layout.tsx        # Layout raíz (fuentes, metadatos globales)
│   └── page.tsx          # Página principal (Home)
├── assets/               # Imágenes y recursos estáticos locales
├── components/
│   ├── layout/           # Componentes estructurales (Header, Footer, etc.)
│   └── ui/               # Componentes reutilizables de interfaz
├── hooks/                # Custom hooks de React
├── styles/
│   ├── _variables.scss   # Tokens de diseño (colores, tipografías, espaciados)
│   ├── _mixins.scss      # Mixins de responsive design y CSS Grid
│   └── global.scss       # Estilos base y reset
├── types/                # Definiciones de tipos TypeScript globales
└── utils/                # Funciones utilitarias puras
```

---

## 🎨 Sistema de Estilos

El sistema de estilos se rige por dos reglas fundamentales:

1. **SCSS Modules exclusivamente.** Cada componente tiene su propio archivo `.module.scss`. Esto garantiza encapsulación y evita colisiones de nombres.
2. **JSX limpio (sin "Class Soup").** El marcado debe ser semántico y sin clases utilitarias. La lógica visual vive en el archivo SCSS.

```tsx
// ✅ Correcto
<section className={styles.heroSection}>
  <h1 className={styles.heading}>{title}</h1>
</section>

// ❌ Incorrecto
<section className="pt-20 flex flex-col items-center bg-gray-900">
```

### Responsive Design

El responsive se gestiona exclusivamente con mixins personalizados definidos en `_mixins.scss`:

```scss
// Uso del mixin de breakpoints
.heroSection {
  padding: 4rem 2rem;

  @include responder-a('tablet') {
    padding: 6rem 4rem;
  }

  @include responder-a('desktop') {
    padding: 8rem 6rem;
  }
}
```

> **Prohibido:** Tailwind CSS, Bootstrap, estilos en línea y cualquier otro framework CSS externo.

---

## 🎬 Sistema de Animaciones (GSAP)

Todas las animaciones se implementan con **GSAP** usando el hook `useGSAP` de `@gsap/react`. Esto asegura que las animaciones se registren y limpien correctamente en el ciclo de vida de React, evitando memory leaks.

```tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{/* ... */}</div>;
}
```

> **Prohibido:** `useEffect` para animaciones GSAP, `setTimeout`, `setInterval` ni librerías de animación alternativas.

---

## 🔗 Consumo de API

El frontend se comunica exclusivamente con el backend a través de funciones centralizadas en la carpeta `src/api/`. Las URLs se configuran mediante variables de entorno.

**URL base (producción):** `https://api.claudiosalazar.cl`  
**URL base (local):** `http://localhost:5001`

### Ejemplo de fetch

```ts
// src/api/projects.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProjects() {
  const res = await fetch(`${BASE_URL}/api/projects`);
  if (!res.ok) throw new Error('Error al cargar los proyectos');
  const json = await res.json();
  return json.data; // { success: true, data: [...] }
}
```

Todos los datos dinámicos (Hero, Sobre Mí, Proyectos) se obtienen de la API. **Nunca se hardcodean textos en el frontend.**

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` en la raíz de `frontend/` con el siguiente contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:3000)
npm run dev

# Build de producción
npm run build

# Iniciar en modo producción
npm start

# Análisis de calidad de código
npm run lint
```

---

## 📋 Reglas y Convenciones

| Regla | Descripción |
|---|---|
| **Datos** | Nunca hardcodear contenido; siempre desde la API |
| **Estilos** | SCSS Modules únicamente, sin frameworks externos |
| **Animaciones** | Solo GSAP con `useGSAP`; siempre hacer cleanup |
| **Tipos** | Definir interfaces TypeScript para todos los datos de la API |
| **Componentes** | Un componente por archivo; nombre en PascalCase |

---

**Autor:** Claudio Salazar — 2026
