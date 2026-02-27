# Skill: SCSS Best Practices (Next.js App Router)

## 📌 Propósito

Este documento define las convenciones de escritura de estilos utilizando **SCSS Modules**. Esto garantiza un código CSS modular, predecible, exento de colisiones y fácil de mantener.

---

## 🧱 Arquitectura de Estilos

El proyecto utiliza una combinación de variables globales/mixins y módulos locales por componente.

*   `src/styles/` (o equivalente): Contiene colores globales, tipografía, reset de CSS (`globals.scss`) y utilidades (`mixins.scss`, `variables.scss`).
*   **SCSS Modules**: Cada componente de React tiene un archivo asociado llamado `[NombreComponente].module.scss`.

---

## 📏 Reglas Estándar de SCSS Modules

### 1. Nomenclatura de Clases (camelCase)

Dado que usamos módulos, las clases en el archivo `.scss` deben escribirse en **camelCase**. Esto permite importarlas directamente como propiedades de objeto en JavaScript/TypeScript sin usar bracket notation.

```scss
// ❌ Incorrecto (kebab-case)
.project-card { ... }
.is-active { ... }

// ✅ Correcto (camelCase)
.projectCard { ... }
.isActive { ... }
```

```tsx
// ❌ Incorrecto (difícil de leer)
<div className={styles['project-card']}>

// ✅ Correcto (limpio)
<div className={styles.projectCard}>
```

---

### 2. Evitar la "Sopa de Clases" en JSX

Los estilos deben componerse dentro del archivo SCSS, no encadenando múltiples clases lógicas en el componente React como se haría con Tailwind.

**❌ Incorrecto (Class Soup en JSX):**
```tsx
<div className={`${styles.card} ${styles.shadowLg} ${styles.roundedMd} ${styles.flexContainer}`}>
  ...
</div>
```

**✅ Correcto (JSX limpio, composición en SCSS):**
```tsx
<div className={styles.projectCard}>
  ...
</div>
```
```scss
// en el SCSS module
.projectCard {
  display: flex;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  // ... resto de propiedades
}
```

---

### 3. Modificadores de Estado

Cuando un componente cambia visualmente según un estado (ej. `isActive`), se añade una clase modificadora de forma condicional.

```tsx
// Ejemplo con estado activo
<button className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}>
  Click Me
</button>
```

```scss
.btn {
  background: var(--color-primary);
  transition: opacity 0.3s ease;

  // Estado activo adjunto a la misma clase
  &.btnActive {
    opacity: 0.8;
    background: var(--color-primary-dark);
  }

  // Hover
  &:hover {
    transform: translateY(-2px);
  }
}
```

> **Tip:** Usa una librería ligera como `clsx` o `classnames` si la concatenación condicional se vuelve compleja.

---

### 4. Anidamiento Prudente (Max 3 niveles)

El anidamiento (nesting) del código SCSS facilita la legibilidad, pero un anidamiento excesivo genera selectores CSS brutalmente pesados y difíciles de sobreescribir (problemas de especificidad).

**La regla de oro es: MÁXIMO 3 niveles de profundidad.**

```scss
// ✅ Correcto (Poco anidado, usando la potencia de los módulos)
.card {
  padding: 2rem;

  .title {
    font-size: 1.5rem;
  }

  .description {
    color: var(--color-text-muted);
  }
}

// ❌ Incorrecto (Especificidad innecesaria)
.card {
  .header {
    .titleContainer {
      h2 {
        span {
          color: red; // ¡El selector resultante será inmanejable!
        }
      }
    }
  }
}
```
Si te encuentras anidando más de 3 niveles, es muy probable que necesites crear clases separadas (como en el ejemplo correcto).

---

### 5. Estilos Globales vs Locales

Los módulos encapsulan estilos evitando que afecten a otros componentes. Sin embargo, a veces necesitas alterar el estilo de un elemento hijo renderizado por una librería externa (ej. un componente HTML inyectado) o apuntar a una clase global (como las de Next.js App Router).

Para esto se usa `:global()`.

```scss
.richTextContainer {
  /* Estilos para nuestro contenedor */
  max-width: 800px;

  /* Estilos para etiquetas generadas internamente (ej. strings con HTML convertidos) */
  :global {
    h2 {
      margin-top: 2rem;
      font-weight: bold;
    }
    p {
      line-height: 1.6;
    }
  }
}
```

### 6. Importando Mixins y Variables (`@use`)

**NUNCA** uses `@import` (está obsoleto en Dart Sass). Utiliza siempre `@use` al inicio del archivo, y hazlo preferiblemente con un alias ('`as`').

```scss
// ❌ Incorrecto
@import '../../styles/mixins.scss';
@import '../../styles/variables.scss';

// ✅ Correcto
@use '@/styles/mixins' as m;
@use '@/styles/variables' as v; // Si son variables SCSS puras

.miClase {
  @include m.up('md') {
    color: v.$primary-color;
  }
}
```
*(Nota: Hoy en día es preferible usar Custom Properties de CSS `var(--color-primary)` definidas en el `:root` de `globals.scss` en lugar de variables `$variables` de SCSS si esos valores no requieren manipulación matemática previa)*.
