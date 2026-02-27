# Skill: Animaciones con GSAP en Next.js

## 📌 Propósito

Este documento establece el estándar oficial para implementar animaciones transversales en el frontend del portafolio. **Todo el portafolio utiliza exclusivamente GSAP.** Queda estrictamente prohibido el uso de Framer Motion, animaciones CSS complejas (más allá de un `hover: transition`), o cualquier otra librería de animación de terceros.

---

## 🏗️ Arquitectura de Animaciones

El proyecto requiere un manejo cuidadoso de GSAP dentro del entorno de Next.js (App Router y React Server/Client Components).

### 1. Entorno de Ejecución

GSAP interactúa directamente con el DOM. Por lo tanto, **CUALQUIER** componente que contenga una animación GSAP **debe** incluir la directiva `'use client';` en la primera línea del archivo.

```tsx
'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
// ... rest of imports
```

---

## 🧩 Herramienta Principal: `@gsap/react`

Para evitar problemas de hidratación en React, limpieza de selectores, y memory leaks, usamos el hook oficial `useGSAP`. **NUNCA** utilices `useEffect` o `useLayoutEffect` directamente para inicializar animaciones de GSAP en este proyecto.

### Registro Global de GSAP

En un archivo de utilidad central (ej. `src/utils/gsap-setup.ts`), debes registrar los plugins necesarios.

```typescript
// src/utils/gsap-setup.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, ScrollTrigger, useGSAP };
```

Luego, en tus componentes, importa estas instancias configuradas.

---

## 📐 Patrones Estándar de Animación

### 1. Animaciones de Entrada (Página / Componente)

Útil para Hero sections, títulos, o elementos que deben aparecer cuando el componente se monta por primera vez.

```tsx
import { useRef } from 'react';
import { gsap, useGSAP } from '@/utils/gsap-setup';
import styles from './Hero.module.scss'; // Ejemplo usando SCSS Modules

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // El contexto de gsap está contenido aquí.
      // Puedes usar selectores CSS seguros que solo apliquen dentro de 'container'
      gsap.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.2, // Si hay múltiples títulos
      });
    },
    { scope: container } // MUY IMPORTANTE: Define el alcance
  );

  return (
    <section ref={container} className={styles.heroSection}>
      <h1 className="hero-title">Construyendo</h1>
      <h1 className="hero-title">Experiencias Fluidas</h1>
    </section>
  );
}
```

### 2. Animaciones Basadas en Scroll (ScrollTrigger)

Para elementos que deben animarse a medida que el usuario hace scroll hacia ellos (ej. listas de proyectos, secciones de "Sobre mí").

```tsx
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/utils/gsap-setup';
import styles from './ProjectList.module.scss';

export default function ProjectList({ projects }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray('.project-card');

      cards.forEach((card) => {
        gsap.from(card as Element, {
          y: 100,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card as Element,
            start: 'top 85%', // Inicia cuando el top del card llega al 85% del viewport
            toggleActions: 'play none none reverse', // Anima al entrar, revierte al subir
            // markers: true, // Útil para debug (remover en prod)
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} className={styles.projectGrid}>
      {projects.map((p) => (
        <article key={p.id} className={`project-card ${styles.card}`}>
          {/* Contenido del proyecto */}
        </article>
      ))}
    </div>
  );
}
```

---

## 🚫 Anti-patrones y Reglas Estrictas

| ❌ No hacer | ✅ Hacer en su lugar |
| :--- | :--- |
| Usar `useEffect` o `useLayoutEffect` para GSAP. | Usar el hook oficial `useGSAP`. |
| Seleccionar elementos globalmente (`gsap.to('.clase', ...)` sin un scope). | Pasar `{ scope: ref }` a `useGSAP` para aislar los selectores al componente. |
| Mezclar animaciones CSS complejas (keyframes) con GSAP. | Dejar las transiciones simples (ej. `hover: color`) para CSS y **todo** el layout/movimiento para GSAP. |
| Registrar `ScrollTrigger` en cada archivo. | Importar desde una utilidad central `gsap-setup.ts` ya configurada. |

---

## 💡 Mejores Prácticas de Rendimiento (Evitar el Jank)

1.  **Anima `transform` y `opacity`:** Nunca animes propiedades como `width`, `height`, `top`, `left`, `margin` o `padding`. Esto provoca un *reflow* costoso en el navegador. En su lugar, usa `x`, `y`, `scale` y `opacity`.
2.  **`will-change` (con precaución):** Si una animación compleja tartamudea, considera agregar `will-change: transform, opacity;` en el SCSS del elemento, pero quítalo al terminar la animación si es posible, o úsalo solo en elementos críticos.
3.  **limpieza:** `useGSAP` se encarga automáticamente de hacer `.revert()` a las animaciones cuando el componente se desmonta, previniendo memory leaks (especialmente importante con ScrollTrigger en Next.js App Router). Por eso su uso es obligatorio.
