# Skill: Sistema de Grid y Layout con SCSS

## 📌 Propósito

Este documento establece el estándar para construir la estructura visual (Layout) de las páginas y componentes del portafolio. Dado que **no utilizamos frameworks CSS** como Bootstrap o Tailwind, dependemos completamente de un sistema de Grid y Flexbox propio, construido con mixins de SCSS.

---

## 🏗️ La Base: Flexbox y CSS Grid

Para cualquier layout bidimensional, la opción por defecto es **CSS Grid**. Para alineamientos unidimensionales (filas o columnas simples), la opción es **Flexbox**.

### 1. Variables Globales de Espaciado

Todo margen o padding iterativo debe usar las variables definidas en `src/styles/variables.scss` (o equivalente). **¡Nunca hardcodees píxeles mágicos (ej. `margin-top: 37px`)!**

```scss
// Ejemplo hipotético de variables (referencia)
$spacing-xs: 0.5rem;   // 8px
$spacing-sm: 1rem;     // 16px
$spacing-md: 2rem;     // 32px
$spacing-lg: 4rem;     // 64px
$spacing-xl: 8rem;     // 128px
```

---

## 📐 Sistema de Contenedores

Cada sección principal de la página debe estar envuelta en un contenedor que limite su ancho máximo en pantallas ultra anchas y provea padding lateral en móviles.

**Implementación en el .module.scss:**

```scss
@use '@/styles/mixins' as m;

.section {
  width: 100%;
  padding: var(--spacing-lg) 0; // Usar variables CSS o SCSS
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-sm); // Margen de seguridad en móviles
}
```

**Uso en React:**

```tsx
import styles from './Hero.module.scss';

export function Hero() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Contenido aquí */}
      </div>
    </section>
  );
}
```

---

## 📱 Mixins para Responsive Design (Media Queries)

**Nunca** escribas `@media (min-width: ...)` directamente en el código de los componentes. Usa exclusivamente los mixins proporcionados.

```scss
// Así se define en styles/mixins.scss (Referencia)
$breakpoints: (
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px
);

@mixin up($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

### Cómo usarlo en tus componentes:

Siempre seguimos la metodología **Mobile First**. Escribe los estilos base para móvil, y luego usa el mixin `@include m.up(...)` para ajustar hacia pantallas más grandes.

```scss
@use '@/styles/mixins' as m;

.cardGrid {
  display: grid;
  gap: var(--spacing-md);
  // Base: 1 columna en móvil
  grid-template-columns: 1fr;

  // Tablet (>= 768px): 2 columnas
  @include m.up('md') {
    grid-template-columns: repeat(2, 1fr);
  }

  // Desktop (>= 992px): 3 columnas
  @include m.up('lg') {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🚫 Prácticas Prohibidas en Layout

| ❌ No hacer | ✅ Hacer en su lugar |
| :--- | :--- |
| `width: 100vw;` (causa scroll horizontal si hay barra de scroll vertical). | `width: 100%;` |
| `height: 100vh;` (problemas en iOS Safari con la barra de navegación). | `min-height: 100dvh;` (usar Dynamic Viewport Height). |
| Hardcodear Breakpoints (`@media (max-width: 768px)`). | Usar el mixin correspondiente (`@include m.up('md')`). |
| Usar floats (`float: left`) para layout. | Usar Flexbox o CSS Grid exclusivamente. |
| Márgenes negativos para compensar gutters en grids. | Usar la propiedad `gap` en Flex o Grid. |
