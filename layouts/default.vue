<!-- layouts/default.vue -->
<template>
    <div class="default-layout">
      <!-- Header con contenedor centralizado -->
      <header class="header">
        <div class="container">
          <NuxtLink to="/" class="logo">ActividApp</NuxtLink>
        </div>
      </header>
  
      <!-- Contenido principal -->
      <main class="main-content container">
        <slot />
      </main>
  
      <!-- Footer con información mínima -->
      <footer class="footer">
        <div class="container">
          <p>&copy; {{ new Date().getFullYear() }} ActividApp. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  </template>
  
  <script setup>
  // No se requiere lógica adicional en este layout por el momento.
  </script>
  
  <style scoped>
  .default-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  /* Header minimalista: fondo blanco, borde inferior y tipografía minimal */
  .header {
    background-color: var(--background-color);
    border-bottom: 1px solid var(--primary-color);
    padding: var(--spacing-medium) 0;
  }
  
  /* Logo: tipografía Meslo Mono, tamaño y color definidos por variables */
  .logo {
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--primary-color);
    text-decoration: none;
  }
  
  /* Contenido principal: uso del contenedor central y espacio */
  .main-content {
    flex: 1;
    padding: var(--spacing-medium) 0;
  }
  
  /* Footer: diseño minimal con borde superior */
  .footer {
    padding: var(--spacing-medium) 0;
    border-top: 1px solid var(--primary-color);
    text-align: center;
    font-size: 0.875rem;
    color: var(--secondary-color);
  }
  </style>